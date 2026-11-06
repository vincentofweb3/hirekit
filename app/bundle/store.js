const PREFIX = "hirekit/";
export const KEYS = {
  profile: `${PREFIX}profile`,
  settings: `${PREFIX}settings`,
  tracker: `${PREFIX}tracker`,
  kitIndex: `${PREFIX}kits/index`,
  lastKit: `${PREFIX}last`,
};
const kitKey = (id) => `${PREFIX}kits/${id}`;

export class Store {
  constructor(host, { onError } = {}) {
    this.host = host;
    this.onError = onError || (() => {});
  }

  localGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  localSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota errors */
    }
  }

  localRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  async get(key, fallback = null) {
    if (this.host) {
      try {
        const res = await this.host.storage.get({ key });
        return res && res.exists ? res.value : fallback;
      } catch (err) {
        this.onError(err, "read");
      }
    }
    return this.localGet(key, fallback);
  }

  async set(key, value) {
    if (this.host) {
      try {
        await this.host.storage.set({ key, value });
        this.localSet(key, value);
        return;
      } catch (err) {
        this.localSet(key, value);
        this.onError(err, "write");
        throw err;
      }
    }
    this.localSet(key, value);
  }

  async remove(key) {
    if (this.host) {
      try {
        await this.host.storage.delete({ key });
      } catch (err) {
        if (!String(err?.message || err).toLowerCase().includes("not_found")) {
          this.onError(err, "delete");
        }
      }
    }
    this.localRemove(key);
  }

  async list(prefix) {
    if (this.host) {
      try {
        const res = await this.host.storage.list({ prefix, limit: 1000 });
        return res?.items || [];
      } catch (err) {
        this.onError(err, "list");
      }
    }
    const items = [];
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) items.push({ key });
      }
    } catch {
      /* ignore */
    }
    return items;
  }

  async load() {
    const [profile, settings, tracker, lastKitId] = await Promise.all([
      this.get(KEYS.profile, null),
      this.get(KEYS.settings, {}),
      this.get(KEYS.tracker, []),
      this.get(KEYS.lastKit, null),
    ]);
    let lastKit = null;
    if (lastKitId) lastKit = await this.get(kitKey(lastKitId), null);
    return { profile, settings: settings || {}, tracker: tracker || [], lastKit };
  }

  async saveProfile(profile) {
    await this.set(KEYS.profile, profile);
  }

  async saveSettings(settings) {
    await this.set(KEYS.settings, settings);
  }

  async saveTracker(tracker) {
    await this.set(KEYS.tracker, tracker);
  }

  async saveKit(snapshot) {
    const index = (await this.get(KEYS.kitIndex, [])) || [];
    const meta = {
      id: snapshot.id,
      role: snapshot.job?.title || "Untitled role",
      company: snapshot.job?.company || "",
      score: snapshot.kit?.fit?.score ?? 0,
      createdAt: snapshot.createdAt,
    };
    const next = [meta, ...index.filter((item) => item.id !== snapshot.id)].slice(0, 20);
    const keep = new Set(next.map((item) => item.id));
    const stale = index.filter((item) => item?.id && !keep.has(item.id));
    for (const item of stale) await this.remove(kitKey(item.id));
    await this.set(kitKey(snapshot.id), snapshot);
    await this.set(KEYS.kitIndex, next);
    await this.set(KEYS.lastKit, snapshot.id);
  }

  async loadKit(id) {
    return this.get(kitKey(id), null);
  }

  async deleteKit(id) {
    await this.remove(kitKey(id));
    const index = (await this.get(KEYS.kitIndex, [])) || [];
    await this.set(KEYS.kitIndex, index.filter((item) => item.id !== id));
    const last = await this.get(KEYS.lastKit, null);
    if (last === id) await this.remove(KEYS.lastKit);
  }

  async dataSummary() {
    const [index, tracker] = await Promise.all([
      this.get(KEYS.kitIndex, []),
      this.get(KEYS.tracker, []),
    ]);
    return { kits: (index || []).length, tracker: (tracker || []).length };
  }

  async deleteAll() {
    const items = await this.list(PREFIX);
    for (const item of items) await this.remove(item.key);
    for (const key of [KEYS.profile, KEYS.settings, KEYS.tracker, KEYS.kitIndex, KEYS.lastKit]) {
      this.localRemove(key);
    }
    try {
      const stale = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX)) stale.push(key);
      }
      stale.forEach((key) => localStorage.removeItem(key));
    } catch {
      /* ignore */
    }
  }
}
