import { Store } from "./store.js";
import { Pipeline, STAGES } from "./pipeline.js";
import { SAMPLE } from "./sample.js";

const TOOL_ID = window.__ANNA_TOOL_IDS__?.hirekit || "tool-dev-hirekit";
const APP_VERSION = "0.1.0";
const TRACKER_STATUSES = ["Saved", "Applied", "Interview", "Closed"];
const TRACKS = ["Backend", "Frontend", "Full-stack", "Data/ML", "Mobile", "DevOps/Cloud", "QA", "Other"];
const LEVELS = ["Intern", "Junior", "Mid", "Senior"];
const TONES = ["Direct", "Warm", "Formal"];
const MAX_JOB_WORDS = 4000;
const MAX_CV_WORDS = 6000;

const ICON = {
  check: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  alert: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2.5l6 11H2l6-11z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 6.2v3.1M8 11.5v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.6"/><path d="M8 7.2v4M8 4.9v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  dot: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg>',
  link: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6.5 9.5l3-3M5 11H4a2.5 2.5 0 010-5h2M11 5h1a2.5 2.5 0 010 5h-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  copy: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5.5" y="5.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M10.5 5.5v-1A1.5 1.5 0 009 3H4.5A1.5 1.5 0 003 4.5V9a1.5 1.5 0 001.5 1.5h1" stroke="currentColor" stroke-width="1.4"/></svg>',
  download: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2.5v7M5.5 7L8 9.5 10.5 7M3 12.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  close: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  arrow: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h9M9 4.5L12.5 8 9 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sun: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M12.6 3.4l-.7.7M4.1 11.9l-.7.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  settings: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.6v1.2M8 13.2v1.2M1.6 8h1.2M13.2 8h1.2M3.5 3.5l.9.9M11.6 11.6l.9.9M12.5 3.5l-.9.9M4.4 11.6l-.9.9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  trash: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 4.5h11M6 4.5V3h4v1.5M4 4.5l.6 8.5h6.8l.6-8.5M6.5 7v4M9.5 7v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowLeft: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M13 8H4M7 4.5L3.5 8 7 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const state = {
  ready: false,
  screen: "new",
  kitTab: "resume",
  jobText: "",
  cvText: "",
  track: "Backend",
  level: "Junior",
  tone: "Direct",
  profile: null,
  current: null,
  lastKit: null,
  tracker: [],
  settings: { theme: "system" },
  summary: { kits: 0, tracker: 0 },
  busy: false,
  progress: null,
  formErrors: {},
  banner: null,
  toast: null,
  storageError: false,
  demo: false,
  needsAnswers: {},
  editingLetter: false,
  letterDraft: "",
  dialog: null,
  returnFocus: null,
  undo: null,
  trackerFilter: "all",
  settingsCv: undefined,
  runToken: 0,
  focusMain: false,
};

let host = null;
let store = null;
let pipeline = null;
let toastTimer = null;
const appEl = document.getElementById("app");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function attr(value) {
  return esc(value);
}

function clone(value) {
  if (value == null) return value;
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function wordCount(text) {
  const trimmed = String(text || "").trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ""), window.location.href);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {
    return null;
  }
  return null;
}

function riskText(risk) {
  if (typeof risk === "string") return risk;
  if (!risk || typeof risk !== "object") return "";
  return risk.text || risk.reason || risk.claim || risk.detail || "";
}

function statusMeta(status) {
  if (status === "covered") return { label: "Covered", cls: "ok", icon: ICON.check };
  if (status === "partial") return { label: "Partial", cls: "warn", icon: ICON.alert };
  if (status === "gap") return { label: "Gap", cls: "bad", icon: ICON.dot };
  return { label: "Unclear", cls: "", icon: ICON.dot };
}

function lintMeta(status) {
  if (status === "pass") return { label: "Pass", cls: "is-pass", icon: ICON.check };
  if (status === "partial") return { label: "Check", cls: "is-warn", icon: ICON.alert };
  return { label: "Fix", cls: "is-fail", icon: ICON.alert };
}

function bandClass(score) {
  if (score >= 80) return "ok";
  if (score >= 60) return "warn";
  return "bad";
}

function scoreRing(score, band) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "var(--hk-pass)" : value >= 60 ? "var(--hk-partial)" : "var(--hk-fail)";
  return `
    <div class="hk-score-ring" role="img" aria-label="Fit score ${value} out of 100, ${esc(band || "unrated")}">
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="${radius}" fill="none" stroke="var(--hk-s3)" stroke-width="6"></circle>
        <circle cx="32" cy="32" r="${radius}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
      </svg>
      <span class="hk-score-ring-text">${value}</span>
    </div>
  `;
}

function mark() {
  return `
    <svg class="hk-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="var(--hk-s1)" stroke="var(--hk-accent)" stroke-width="2"></rect>
      <path d="M8.5 11h7M8.5 16h13M8.5 21h9" stroke="var(--hk-muted)" stroke-width="2.2" stroke-linecap="round"></path>
      <path d="M20.5 11l2.6 2.6 4.2-5" fill="none" stroke="var(--hk-accent)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  `;
}

function currentEvidence() {
  return state.current?.evidence?.items || [];
}

function evidenceById(id) {
  return currentEvidence().find((item) => item.id === id) || null;
}

function answeredIds() {
  return new Set((state.current?.answers || []).map((answer) => answer.question_id));
}

function openNeedsCount() {
  const questions = state.current?.kit?.needs_input || [];
  const answered = answeredIds();
  return questions.filter((question) => !answered.has(question.id)).length;
}

function render() {
  if (!state.ready) return;
  const focus = captureFocus();
  appEl.innerHTML = renderApp();
  restoreFocus(focus);
  if (state.focusMain) {
    state.focusMain = false;
    const heading = document.getElementById("main-heading");
    if (heading) heading.focus({ preventScroll: true });
  }
  if (state.dialog) {
    const target = appEl.querySelector("[data-autofocus]") || appEl.querySelector(".hk-dialog input, .hk-dialog textarea, .hk-dialog select, .hk-dialog button");
    if (target) target.focus({ preventScroll: true });
  }
}

function captureFocus() {
  const el = document.activeElement;
  if (!el || !appEl.contains(el)) return null;
  return {
    key: el.dataset.focusKey || "",
    id: el.id || "",
    start: typeof el.selectionStart === "number" ? el.selectionStart : null,
    end: typeof el.selectionEnd === "number" ? el.selectionEnd : null,
  };
}

function restoreFocus(focus) {
  if (!focus) return;
  let el = null;
  if (focus.key) el = appEl.querySelector(`[data-focus-key="${focus.key.replace(/"/g, '\\"')}"]`);
  if (!el && focus.id) el = document.getElementById(focus.id);
  if (!el) return;
  el.focus({ preventScroll: true });
  if (focus.start != null && typeof el.setSelectionRange === "function") {
    try {
      el.setSelectionRange(focus.start, focus.end);
    } catch {
      /* ignore */
    }
  }
}

function renderApp() {
  return `
    <div class="hk-app">
      ${renderHeader()}
      <main class="hk-main" id="main">
        ${renderBanner()}
        ${renderScreen()}
      </main>
      ${renderFooter()}
      ${renderMobileAction()}
    </div>
    <div class="hk-toast-region" id="toast-region" aria-live="polite">${renderToast()}</div>
    ${renderDialog()}
  `;
}

function renderHeader() {
  const needs = openNeedsCount();
  const nav = [
    { key: "new", label: "New kit" },
    { key: "report", label: "Report", disabled: !state.current },
    { key: "kit", label: "Kit", disabled: !state.current?.kit, count: needs },
    { key: "tracker", label: "Tracker" },
  ];
  return `
    <header class="hk-header">
      <div class="hk-header-inner">
        <button type="button" class="hk-brand" data-action="nav" data-nav="new" aria-label="HireKit home">
          ${mark()}
          <span>HireKit</span>
        </button>
        <nav class="hk-nav" aria-label="Main">
          ${nav.map((item) => `
            <button type="button" class="hk-nav-btn" data-action="nav" data-nav="${item.key}"
              ${item.disabled ? "disabled" : ""}
              ${state.screen === item.key ? 'aria-current="page"' : ""}>
              ${esc(item.label)}${item.count ? `<span class="hk-nav-count" aria-label="${item.count} open questions">${item.count}</span>` : ""}
            </button>
          `).join("")}
        </nav>
        <div class="hk-header-actions">
          ${state.demo ? '<span class="hk-preview" title="The Anna host is not connected, so this build uses sample data.">Preview</span>' : ""}
          <button type="button" class="hk-icon-btn" data-action="theme" aria-label="Theme: ${esc(state.settings.theme || "system")}. Change theme." title="Theme">
            ${ICON.sun}
          </button>
          <button type="button" class="hk-icon-btn" data-action="nav" data-nav="settings" aria-label="Settings" title="Settings">
            ${ICON.settings}
          </button>
        </div>
      </div>
    </header>
  `;
}

function renderFooter() {
  return `
    <footer class="hk-footer">
      <div class="hk-footer-inner">
        <span>Evidence-first. No invented claims.</span>
        <span>HireKit v${APP_VERSION} · Your data stays in your Anna storage.</span>
      </div>
    </footer>
  `;
}

function renderMobileAction() {
  if (state.screen !== "new") return "";
  return `
    <div class="hk-mobile-action">
      <button type="button" class="hk-btn hk-btn-primary hk-btn-block" data-action="build" ${state.busy ? "disabled" : ""}>
        ${state.busy ? "Building…" : "Build my kit"}
      </button>
    </div>
  `;
}

function renderBanner() {
  let banner = state.banner;
  if (!banner && state.storageError) {
    banner = {
      kind: "error",
      message: "Could not save to Anna storage. Your kit is still on screen. Copy it now if you need it.",
      actions: [{ label: "Dismiss", action: "dismiss-banner" }],
    };
  }
  if (!banner && !navigator.onLine && !state.demo) {
    banner = { kind: "warn", message: "You are offline. Reconnect before building or saving.", actions: [] };
  }
  if (!banner) return "";
  const icon = banner.kind === "error" ? ICON.alert : banner.kind === "warn" ? ICON.alert : ICON.info;
  return `
    <div class="hk-banner hk-banner-${banner.kind}" role="${banner.kind === "error" ? "alert" : "status"}">
      <span class="hk-banner-icon">${icon}</span>
      <div class="hk-banner-body">
        <p>${esc(banner.message)}</p>
        ${banner.actions?.length ? `<div class="hk-banner-actions">${banner.actions.map((action) => `<button type="button" class="hk-btn hk-btn-sm" data-action="${attr(action.action)}">${esc(action.label)}</button>`).join("")}</div>` : ""}
      </div>
    </div>
  `;
}

function renderScreen() {
  if (!state.ready) return renderBoot();
  if (state.screen === "progress") return renderProgress();
  if (state.screen === "report") return renderReport();
  if (state.screen === "kit") return renderKit();
  if (state.screen === "tracker") return renderTracker();
  if (state.screen === "settings") return renderSettings();
  return renderNew();
}

function renderBoot() {
  return `
    <div class="hk-boot-inner">
      <p class="hk-eyebrow">HireKit</p>
      <h1>Your evidence, not a rewrite.</h1>
      <p class="hk-muted">Loading your workspace…</p>
    </div>
  `;
}

function renderNew() {
  const errors = state.formErrors || {};
  const jobWords = wordCount(state.jobText);
  const cvWords = wordCount(state.cvText);
  const hasErrors = Object.keys(errors).length > 0;
  return `
    <div class="hk-screen">
      <div class="hk-hero">
        <div>
          <p class="hk-eyebrow">Application copilot</p>
          <h1 id="main-heading" tabindex="-1">Your evidence, not a rewrite.</h1>
          <p class="hk-lede">Paste a job and your CV. HireKit builds a fit report, resume bullets, a cover letter, outreach, and interview prep — with every line tied to something you actually did.</p>
          ${state.demo ? `
            <div class="hk-banner hk-banner-info" role="status">
              <span class="hk-banner-icon">${ICON.info}</span>
              <div class="hk-banner-body">
                <p><strong>Preview mode.</strong> The Anna host is not connected, so builds use sample data. Connect the host to use your own CV and job post.</p>
              </div>
            </div>
          ` : ""}
          ${state.lastKit ? renderLastKit() : ""}
          <div class="hk-card hk-card-pad">
            <form class="hk-form" novalidate>
              ${hasErrors ? `
                <div class="hk-banner hk-banner-error" role="alert">
                  <span class="hk-banner-icon">${ICON.alert}</span>
                  <div class="hk-banner-body"><p>Check the highlighted fields before building.</p></div>
                </div>
              ` : ""}
              <div class="hk-field">
                <label class="hk-label" for="job-input">
                  <span>Job post</span>
                  <span class="hk-counter" data-counter="job">${jobWords} / ${MAX_JOB_WORDS} words</span>
                </label>
                <textarea class="hk-textarea hk-textarea-job" id="job-input" data-field="job" data-focus-key="job"
                  aria-invalid="${errors.job ? "true" : "false"}" aria-describedby="job-help job-error"
                  placeholder="Paste the job description here. Include the responsibilities and requirements.">${esc(state.jobText)}</textarea>
                <p class="hk-help" id="job-help">We read the requirements, not the company pitch. 30–${MAX_JOB_WORDS} words.</p>
                ${errors.job ? `<p class="hk-error-text" id="job-error">${esc(errors.job)}</p>` : ""}
              </div>
              <div class="hk-field">
                <label class="hk-label" for="cv-input">
                  <span>Your CV</span>
                  <span class="hk-counter" data-counter="cv">${cvWords} / ${MAX_CV_WORDS} words</span>
                </label>
                ${state.profile?.cv ? `<div><span class="hk-saved-chip">${ICON.check}<span>Saved CV</span><button type="button" class="hk-link hk-small" data-action="nav" data-nav="settings">Edit</button></span></div>` : ""}
                <textarea class="hk-textarea hk-textarea-cv" id="cv-input" data-field="cv" data-focus-key="cv"
                  aria-invalid="${errors.cv ? "true" : "false"}" aria-describedby="cv-help cv-error"
                  placeholder="Paste your CV as text. Projects, internships, and coursework all count.">${esc(state.cvText)}</textarea>
                <p class="hk-help" id="cv-help">Every bullet must quote this text. 40–${MAX_CV_WORDS} words.</p>
                ${errors.cv ? `<p class="hk-error-text" id="cv-error">${esc(errors.cv)}</p>` : ""}
              </div>
              <div class="hk-options">
                <div class="hk-field">
                  <label class="hk-label" for="track-select">Track</label>
                  <select class="hk-select" id="track-select" data-field="track" data-focus-key="track">
                    ${TRACKS.map((track) => `<option value="${attr(track)}" ${state.track === track ? "selected" : ""}>${esc(track)}</option>`).join("")}
                  </select>
                </div>
                <div class="hk-field">
                  <label class="hk-label" for="level-select">Level</label>
                  <select class="hk-select" id="level-select" data-field="level" data-focus-key="level">
                    ${LEVELS.map((level) => `<option value="${attr(level)}" ${state.level === level ? "selected" : ""}>${esc(level)}</option>`).join("")}
                  </select>
                </div>
                <div class="hk-field">
                  <label class="hk-label" for="tone-select">Tone</label>
                  <select class="hk-select" id="tone-select" data-field="tone" data-focus-key="tone">
                    ${TONES.map((tone) => `<option value="${attr(tone)}" ${state.tone === tone ? "selected" : ""}>${esc(tone)}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="hk-row-between">
                <p class="hk-help">Ctrl/⌘ + Enter to build. Your CV and job post are sent only to the model that builds this kit.</p>
                <button type="button" class="hk-btn hk-btn-primary" data-action="build" data-focus-key="build" ${state.busy ? "disabled" : ""}>
                  ${state.busy ? "Building…" : "Build my kit"} ${ICON.arrow}
                </button>
              </div>
            </form>
          </div>
        </div>
        <aside class="hk-stack">
          <div class="hk-card hk-card-pad">
            <h2>What you get</h2>
            <ul class="hk-check-list">
              <li>${ICON.check}<span>A fit report that shows covered, partial, and gap requirements.</span></li>
              <li>${ICON.check}<span>Resume bullets rewritten from your evidence, not invented.</span></li>
              <li>${ICON.check}<span>A cover letter and recruiter outreach you can send today.</span></li>
              <li>${ICON.check}<span>Interview questions with honest answer outlines.</span></li>
              <li>${ICON.check}<span>A gap plan that tells you what to learn before you claim it.</span></li>
            </ul>
          </div>
          <div class="hk-card hk-card-pad">
            <h2>How the claim check works</h2>
            <p class="hk-muted hk-small">Every generated line carries evidence IDs. A second pass removes any claim that does not trace back to a quote from your CV, then asks you for the missing fact.</p>
            <div class="hk-honesty">
              <p class="hk-small"><strong>If we cannot prove it, we do not write it.</strong></p>
              <p class="hk-help">No invented metrics, employers, titles, dates, degrees, or technologies.</p>
            </div>
          </div>
          <div class="hk-card hk-card-pad">
            <h2>Privacy</h2>
            <p class="hk-muted hk-small">Your CV, kits, and tracker live in your Anna storage. HireKit does not post, email, or apply anywhere for you.</p>
          </div>
        </aside>
      </div>
    </div>
  `;
}

function renderLastKit() {
  const kit = state.lastKit;
  const fit = kit.kit?.fit || kit.matches?.fit || {};
  return `
    <div class="hk-card hk-card-pad hk-mb-4">
      <div class="hk-row-between">
        <div>
          <p class="hk-eyebrow hk-mb-3">Continue</p>
          <h2 class="hk-mb-3">${esc(kit.job?.title || "Last kit")}${kit.job?.company ? ` <span class="hk-muted">· ${esc(kit.job.company)}</span>` : ""}</h2>
          <p class="hk-help">${kit.kit ? `${fit.score ?? 0}/100 · ${esc(fit.band || "Unrated")}` : "Report only"} · Built ${esc(formatDate(kit.createdAt))}</p>
        </div>
        <div class="hk-actions">
          <button type="button" class="hk-btn hk-btn-sm" data-action="nav" data-nav="report">Open report</button>
          ${kit.kit ? `<button type="button" class="hk-btn hk-btn-sm" data-action="nav" data-nav="kit">Open kit</button>` : ""}
        </div>
      </div>
    </div>
  `;
}

function renderProgress() {
  const statuses = state.progress?.statuses || STAGES.map((stage) => ({ ...stage, status: "pending" }));
  const done = statuses.filter((stage) => stage.status === "done").length;
  const error = state.progress?.error;
  const percent = Math.round((done / statuses.length) * 100);
  return `
    <div class="hk-screen">
      <div class="hk-card hk-card-pad hk-progress-card">
        <div class="hk-progress-head">
          <p class="hk-eyebrow">Building your kit</p>
          <h1 id="main-heading" tabindex="-1" class="hk-h1-sm">${error ? "The build stopped." : "Checking your evidence."}</h1>
          <p>${error ? "Your inputs are safe. Retry, or go back and edit them." : "This usually takes 20–40 seconds. You can cancel and your inputs will stay."}</p>
        </div>
        ${error ? `
          <div class="hk-banner hk-banner-error" role="alert">
            <span class="hk-banner-icon">${ICON.alert}</span>
            <div class="hk-banner-body">
              <p><strong>${esc(error.code || "Build failed")}</strong> ${esc(error.message || "Something went wrong.")}</p>
              <div class="hk-banner-actions">
                ${error.retryable ? `<button type="button" class="hk-btn hk-btn-sm hk-btn-primary" data-action="retry">Retry</button>` : ""}
                <button type="button" class="hk-btn hk-btn-sm" data-action="cancel">Back to edit</button>
                ${error.hasPartial ? `<button type="button" class="hk-btn hk-btn-sm" data-action="view-report">View report</button>` : ""}
              </div>
            </div>
          </div>
        ` : ""}
        <div class="hk-progress-bar" aria-hidden="true"><span style="width:${percent}%"></span></div>
        <ol class="hk-stage-list" aria-live="polite">
          ${statuses.map((stage) => `
            <li class="hk-stage is-${stage.status}">
              <span class="hk-stage-icon">${stage.status === "done" ? ICON.check : stage.status === "failed" ? "!" : stage.status === "running" ? '<span class="hk-spinner"></span>' : ICON.dot}</span>
              <span class="hk-stage-label">${esc(stage.label)}</span>
              ${stage.status === "running" ? '<span class="hk-sr-only">in progress</span>' : ""}
              ${stage.status === "done" ? '<span class="hk-sr-only">done</span>' : ""}
              ${stage.status === "failed" ? '<span class="hk-sr-only">failed</span>' : ""}
            </li>
          `).join("")}
        </ol>
        ${error ? "" : `<div class="hk-actions hk-center-actions"><button type="button" class="hk-btn" data-action="cancel">Cancel</button></div>`}
      </div>
    </div>
  `;
}

function renderReport() {
  const current = state.current;
  if (!current) return renderEmpty("No report yet", "Build a kit to see how your evidence maps to the job.", "Build a kit", "build");
  const job = current.job || {};
  const matches = current.matches || {};
  const fit = current.kit?.fit || matches.fit || {};
  const requirements = job.requirements || [];
  const matchMap = new Map((matches.matches || []).map((match) => [match.requirement_id, match]));
  const found = matches.keyword_coverage?.found || [];
  const missing = matches.keyword_coverage?.missing || [];
  const claimRisks = (matches.claim_risks || []).map(riskText).filter(Boolean);
  const lint = current.lint || [];
  return `
    <div class="hk-screen">
      <div class="hk-report-top">
        <div class="hk-report-title">
          <p class="hk-eyebrow">Fit report</p>
          <h1 id="main-heading" tabindex="-1">${esc(job.title || "This role")}${job.company ? ` <span class="hk-muted">at ${esc(job.company)}</span>` : ""}</h1>
          <p class="hk-help">${[job.location, job.seniority ? `${job.seniority} level` : "", current.createdAt ? `Built ${formatDate(current.createdAt)}` : ""].filter(Boolean).map(esc).join(" · ")}</p>
        </div>
        <div class="hk-score-box">
          ${scoreRing(fit.score, fit.band)}
          <div class="hk-score-meta">
            <strong>${esc(fit.band || "Unrated")}</strong>
            <span>${fit.score ?? 0} / 100 fit</span>
          </div>
        </div>
      </div>
      ${current.partial ? `
        <div class="hk-banner hk-banner-warn" role="alert">
          <span class="hk-banner-icon">${ICON.alert}</span>
          <div class="hk-banner-body">
            <p><strong>Report only.</strong> The kit did not finish, so there is no verified resume or letter to send yet.</p>
            <div class="hk-banner-actions"><button type="button" class="hk-btn hk-btn-sm hk-btn-primary" data-action="retry">Retry the kit</button></div>
          </div>
        </div>
      ` : ""}
      <div class="hk-grid-2 hk-items-start">
        <div class="hk-stack">
          <div class="hk-card hk-card-pad">
            <div class="hk-card-head">
              <div><h2>What the job asks for</h2><p class="hk-help">Must-haves first. Evidence links open the exact CV quote.</p></div>
            </div>
            <div class="hk-req-list">
              ${requirements.length ? requirements.map((req) => {
                const match = matchMap.get(req.id) || { status: "gap", evidence_ids: [], rationale: "" };
                const meta = statusMeta(match.status);
                return `
                  <div class="hk-req">
                    <div class="hk-req-top">
                      <div class="hk-req-text">${esc(req.text)}</div>
                      <span class="hk-pill hk-pill-${meta.cls}">${meta.icon}${meta.label}</span>
                    </div>
                    <div class="hk-req-meta">
                      <span class="hk-pill">${req.kind === "must" ? "Must-have" : "Nice-to-have"}</span>
                      ${renderEvidenceChips(match.evidence_ids)}
                    </div>
                    ${match.rationale ? `<p class="hk-req-rationale">${esc(match.rationale)}</p>` : ""}
                  </div>
                `;
              }).join("") : '<p class="hk-muted hk-small">No requirements were extracted. Retry with a fuller job post.</p>'}
            </div>
          </div>
          <div class="hk-card hk-card-pad">
            <h2>Keywords</h2>
            <p class="hk-help">Found means the term appears in your evidence. Missing means the job uses it and your CV does not.</p>
            <div class="hk-stack hk-gap-3">
              <div><p class="hk-label">Found (${found.length})</p><div class="hk-chips">${found.length ? found.map((word) => `<span class="hk-chip hk-chip-ok">${esc(word)}</span>`).join("") : '<span class="hk-tiny hk-faint">None yet</span>'}</div></div>
              <div><p class="hk-label">Missing (${missing.length})</p><div class="hk-chips">${missing.length ? missing.map((word) => `<span class="hk-chip hk-chip-bad">${esc(word)}</span>`).join("") : '<span class="hk-tiny hk-faint">None</span>'}</div></div>
            </div>
          </div>
        </div>
        <aside class="hk-stack">
          <div class="hk-card hk-card-pad">
            <h2>Read this first</h2>
            <p class="hk-summary">${esc(fit.summary || "No summary yet.")}</p>
            ${fit.strengths?.length ? `<h3 class="hk-h3-sm">Strengths</h3><ul class="hk-strengths">${fit.strengths.map((item) => `<li>${ICON.check}<span>${esc(item)}</span></li>`).join("")}</ul>` : ""}
            ${fit.risks?.length ? `<h3 class="hk-h3-sm hk-mt-4">Watch out</h3><ul class="hk-risks">${fit.risks.map((item) => `<li>${ICON.alert}<span>${esc(item)}</span></li>`).join("")}</ul>` : ""}
          </div>
          ${claimRisks.length ? `
            <div class="hk-card hk-card-pad">
              <h2>Claim risks</h2>
              <ul class="hk-risks">${claimRisks.map((item) => `<li>${ICON.alert}<span>${esc(item)}</span></li>`).join("")}</ul>
            </div>
          ` : ""}
          <div class="hk-card hk-card-pad">
            <h2>CV check</h2>
            <ul class="hk-lint">
              ${lint.length ? lint.map((item) => {
                const meta = lintMeta(item.status);
                return `<li class="${meta.cls}">${meta.icon}<span>${esc(item.message)}${item.line ? ` <span class="hk-faint">(${esc(item.line)})</span>` : ""}</span></li>`;
              }).join("") : `<li>${ICON.info}<span>No CV issues found.</span></li>`}
            </ul>
          </div>
          <div class="hk-card hk-card-pad">
            <h2>Next</h2>
            <div class="hk-actions">
              ${current.kit ? `<button type="button" class="hk-btn hk-btn-primary" data-action="nav" data-nav="kit">View kit</button>` : `<button type="button" class="hk-btn hk-btn-primary" data-action="retry">Retry kit</button>`}
              ${current.kit ? `<button type="button" class="hk-btn" data-action="save-tracker">Save to tracker</button>` : ""}
              <button type="button" class="hk-btn" data-action="add-evidence">${ICON.plus}Add evidence</button>
            </div>
            ${current.kit ? `<p class="hk-help hk-mt-2">Save to tracker when you are ready to apply. Nothing is sent automatically.</p>` : ""}
          </div>
        </aside>
      </div>
    </div>
  `;
}

function renderEvidenceChips(ids) {
  if (!ids?.length) return '<span class="hk-tiny hk-faint">No evidence</span>';
  return `<div class="hk-chips">${ids.map((id) => {
    const item = evidenceById(id);
    return `<button type="button" class="hk-chip" data-action="evidence" data-id="${attr(id)}" title="View the CV quote">${ICON.link}<span>${esc(item?.title || id)}</span></button>`;
  }).join("")}</div>`;
}

function renderKit() {
  const current = state.current;
  if (!current?.kit) return renderEmpty("No kit yet", current ? "The report is ready, but the kit did not finish. Retry to get your resume, letter, and prep." : "Build a kit first.", current ? "Retry kit" : "Build a kit", current ? "retry" : "build");
  const job = current.job || {};
  const kit = current.kit;
  const tabs = [
    { key: "resume", label: "Resume diff" },
    { key: "letter", label: "Cover letter" },
    { key: "outreach", label: "Outreach" },
    { key: "interview", label: "Interview prep" },
    { key: "gap", label: "Gap plan" },
  ];
  return `
    <div class="hk-screen">
      <div class="hk-report-top">
        <div class="hk-report-title">
          <p class="hk-eyebrow">Application kit</p>
          <h1 id="main-heading" tabindex="-1">${esc(job.title || "This role")}${job.company ? ` <span class="hk-muted">at ${esc(job.company)}</span>` : ""}</h1>
          <p class="hk-help">${plural(kit.bullets?.length || 0, "resume bullet")} · ${plural(kit.interview?.length || 0, "interview question")} · ${plural(kit.gap_plan?.length || 0, "gap")} · Every claim is evidence-linked.</p>
        </div>
        <div class="hk-actions">
          <button type="button" class="hk-btn" data-action="copy-kit">${ICON.copy}Copy kit</button>
          <button type="button" class="hk-btn" data-action="download-kit">${ICON.download}Download .md</button>
          <button type="button" class="hk-btn hk-btn-primary" data-action="save-tracker">Save to tracker</button>
        </div>
      </div>
      ${renderNeedsInput()}
      <div class="hk-tabs" role="tablist" aria-label="Kit sections">
        ${tabs.map((tab) => `
          <button type="button" class="hk-tab" role="tab" id="tab-${tab.key}" aria-controls="panel-${tab.key}"
            aria-selected="${state.kitTab === tab.key}" data-action="tab" data-tab="${tab.key}">
            ${esc(tab.label)}
          </button>
        `).join("")}
      </div>
      <div class="hk-tab-panel" role="tabpanel" id="panel-${state.kitTab}" aria-labelledby="tab-${state.kitTab}">
        ${renderKitTab(kit)}
      </div>
    </div>
  `;
}

function renderNeedsInput() {
  const current = state.current;
  const questions = (current?.kit?.needs_input || []).filter((question) => !answeredIds().has(question.id));
  const pending = Object.values(state.needsAnswers || {}).some((value) => String(value || "").trim());
  if (!questions.length && !pending) {
    return `
      <div class="hk-card hk-card-pad hk-mb-4">
        <div class="hk-row-between">
          <div class="hk-row hk-gap-2">${ICON.check}<strong>No open questions.</strong><span class="hk-muted hk-small">Every generated claim traces back to your CV.</span></div>
          <button type="button" class="hk-btn hk-btn-sm" data-action="add-evidence">${ICON.plus}Add evidence</button>
        </div>
      </div>
    `;
  }
  return `
    <div class="hk-card hk-card-pad hk-needs hk-mb-4" id="needs-input">
      <div class="hk-card-head">
        <div><h2>Questions before you send</h2><p class="hk-help">Answer only what is true. HireKit will fold the answer into the affected lines and keep the evidence trail.</p></div>
        <span class="hk-pill hk-pill-warn">${questions.length} open</span>
      </div>
      ${questions.map((question) => `
        <div class="hk-needs-item">
          <p class="hk-needs-q">${esc(question.question)}</p>
          <textarea class="hk-textarea" rows="2" data-field="needs-answer" data-qid="${attr(question.id)}" data-focus-key="needs-${attr(question.id)}"
            placeholder="Your real answer, or leave blank if it is not true.">${esc(state.needsAnswers?.[question.id] || "")}</textarea>
        </div>
      `).join("")}
      <div class="hk-needs-actions">
        <button type="button" class="hk-btn hk-btn-primary" data-action="needs-update" ${pending ? "" : "disabled"}>Update kit</button>
        <button type="button" class="hk-btn" data-action="add-evidence">${ICON.plus}Add evidence instead</button>
        <span class="hk-help">Answers are saved with this kit only.</span>
      </div>
    </div>
  `;
}

function renderKitTab(kit) {
  if (state.kitTab === "letter") return renderCoverLetter(kit);
  if (state.kitTab === "outreach") return renderOutreach(kit);
  if (state.kitTab === "interview") return renderInterview(kit);
  if (state.kitTab === "gap") return renderGapPlan(kit);
  return renderResumeDiff(kit);
}

function renderResumeDiff(kit) {
  const bullets = kit.bullets || [];
  if (!bullets.length) return renderInlineEmpty("No resume bullets yet.", "Add evidence or retry the build.");
  return `
    <div class="hk-bullet-list">
      ${bullets.map((bullet, index) => `
        <div class="hk-bullet">
          ${bullet.before ? `<p class="hk-bullet-before">${esc(bullet.before)}</p>` : ""}
          <p class="hk-bullet-after">${esc(bullet.text)}</p>
          <div class="hk-bullet-meta">
            ${renderEvidenceChips(bullet.evidence_ids)}
            ${bullet.needs_number ? `<span class="hk-pill hk-pill-warn">${ICON.alert}Needs a real number</span><button type="button" class="hk-btn hk-btn-sm" data-action="add-number" data-index="${index}">Add number</button>` : ""}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderCoverLetter(kit) {
  const letter = kit.cover_letter || { paragraphs: [] };
  const paragraphs = letter.paragraphs || [];
  if (state.editingLetter) {
    return `
      <div class="hk-card hk-card-pad">
        <div class="hk-card-head"><div><h2>Edit cover letter</h2><p class="hk-help">Separate paragraphs with a blank line. Manual edits are not claim-checked.</p></div></div>
        <textarea class="hk-textarea hk-letter-edit" data-field="letter-draft" data-focus-key="letter-draft">${esc(state.letterDraft)}</textarea>
        <div class="hk-dialog-actions">
          <button type="button" class="hk-btn" data-action="cancel-letter">Cancel</button>
          <button type="button" class="hk-btn hk-btn-primary" data-action="save-letter">Save letter</button>
        </div>
      </div>
    `;
  }
  return `
    <div class="hk-card hk-card-pad">
      <div class="hk-card-head">
        <div><h2>Cover letter</h2><p class="hk-help">${state.current?.letterEdited ? "You edited this letter. Manual edits are not claim-checked." : "Generated only from cited evidence."}</p></div>
        <div class="hk-actions">
          <button type="button" class="hk-btn hk-btn-sm" data-action="copy-letter">${ICON.copy}Copy</button>
          <button type="button" class="hk-btn hk-btn-sm" data-action="edit-letter">Edit</button>
          ${state.current?.letterEdited ? `<button type="button" class="hk-btn hk-btn-sm" data-action="restore-letter">Restore generated</button>` : ""}
        </div>
      </div>
      ${paragraphs.length ? `<div class="hk-document">${paragraphs.map((paragraph) => `<p class="${paragraph.kind === "greeting" ? "hk-greeting" : paragraph.kind === "closing" ? "hk-closing" : ""}">${esc(paragraph.text)}</p>`).join("")}</div>` : renderInlineEmpty("No letter yet.", "Retry the build to generate one.")}
    </div>
  `;
}

function renderOutreach(kit) {
  const outreach = kit.outreach || {};
  return `
    <div class="hk-card hk-card-pad">
      <div class="hk-card-head">
        <div><h2>Recruiter outreach</h2><p class="hk-help">Short, specific, and grounded in the same evidence.</p></div>
        <button type="button" class="hk-btn hk-btn-sm" data-action="copy-outreach">${ICON.copy}Copy message</button>
      </div>
      <div class="hk-document">
        <div class="hk-outreach-subject">${esc(outreach.subject || "No subject")}</div>
        <p class="hk-pre">${esc(outreach.message || "No message yet.")}</p>
        ${outreach.evidence_ids?.length ? `<div class="hk-mt-4">${renderEvidenceChips(outreach.evidence_ids)}</div>` : ""}
      </div>
    </div>
  `;
}

function renderInterview(kit) {
  const items = kit.interview || [];
  if (!items.length) return renderInlineEmpty("No interview prep yet.", "Retry the build to generate questions.");
  return `
    <div class="hk-interview-list">
      ${items.map((item) => `
        <div class="hk-interview-item">
          <div class="hk-interview-q">${esc(item.question)}</div>
          ${item.why_asked ? `<div class="hk-interview-why">Why it comes up: ${esc(item.why_asked)}</div>` : ""}
          ${item.answer_outline?.length ? `<ul class="hk-outline">${item.answer_outline.map((point) => `<li>${esc(point)}</li>`).join("")}</ul>` : ""}
          ${item.evidence_ids?.length ? renderEvidenceChips(item.evidence_ids) : '<span class="hk-pill hk-pill-warn">Gap — answer honestly</span>'}
        </div>
      `).join("")}
    </div>
  `;
}

function renderGapPlan(kit) {
  const items = kit.gap_plan || [];
  const reqMap = new Map((state.current?.job?.requirements || []).map((req) => [req.id, req]));
  const matchMap = new Map((state.current?.matches?.matches || []).map((match) => [match.requirement_id, match]));
  if (!items.length) return renderInlineEmpty("No gap plan.", "That means no must-have gaps were found. Still read the report.");
  return `
    <div class="hk-stack">
      <div class="hk-banner hk-banner-warn" role="note">
        <span class="hk-banner-icon">${ICON.alert}</span>
        <div class="hk-banner-body"><p>Do the action before you claim it. This plan is a learning list, not resume text.</p></div>
      </div>
      <div class="hk-gap-list">
        ${items.map((item) => {
          const req = reqMap.get(item.requirement_id);
          const partial = matchMap.get(item.requirement_id)?.status === "partial";
          return `
            <div class="hk-gap-item">
              <div class="hk-row-between">
                <div class="hk-gap-title">${esc(req?.text || item.requirement_id)}</div>
                <span class="hk-pill ${partial ? "hk-pill-warn" : "hk-pill-bad"}">${partial ? "Partial evidence" : "Gap — no evidence"}</span>
              </div>
              <p class="hk-gap-honest">${esc(item.honest_phrasing || "Do not claim this yet.")}</p>
              <p class="hk-small"><strong>Do this:</strong> ${esc(item.action || "Build a small project that uses it.")}</p>
              ${item.effort ? `<p class="hk-help">Estimate: ${esc(item.effort)}</p>` : ""}
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderTracker() {
  const filter = state.trackerFilter;
  const filtered = filter === "all" ? state.tracker : state.tracker.filter((item) => item.status === filter);
  const columns = filter === "all" ? TRACKER_STATUSES : [filter];
  return `
    <div class="hk-screen">
      <div class="hk-report-top">
        <div class="hk-report-title">
          <p class="hk-eyebrow">Tracker</p>
          <h1 id="main-heading" tabindex="-1">Applications</h1>
          <p class="hk-help">${plural(state.tracker.length, "application")} saved. Move cards as you apply. Nothing is sent automatically.</p>
        </div>
        <button type="button" class="hk-btn hk-btn-primary" data-action="add-app">${ICON.plus}Add application</button>
      </div>
      <div class="hk-filter" role="group" aria-label="Filter applications">
        ${["all", ...TRACKER_STATUSES].map((status) => `<button type="button" class="hk-filter-btn" data-action="filter" data-filter="${status}" aria-pressed="${filter === status}">${status === "all" ? "All" : status}</button>`).join("")}
      </div>
      ${!state.tracker.length ? renderEmpty("No applications yet", "Build a kit, then save it here to track what you sent and what happened.", "Build a kit", "nav", "new") : filtered.length ? `
        <div class="hk-tracker-board">
          ${columns.map((status) => {
            const items = filtered.filter((item) => item.status === status);
            return `
              <section class="hk-column is-visible" aria-labelledby="col-${status}">
                <div class="hk-column-head"><h3 id="col-${status}">${status}</h3><span class="hk-count">${items.length}</span></div>
                ${items.length ? items.map((item) => renderTrackerCard(item)).join("") : '<p class="hk-help hk-mt-2">Nothing here yet.</p>'}
              </section>
            `;
          }).join("")}
        </div>
      ` : renderEmpty("Nothing in this column", "Choose another filter or add an application.", "Show all", "filter", "all")}
    </div>
  `;
}

function renderTrackerCard(item) {
  return `
    <article class="hk-track-card">
      <div class="hk-track-role">${esc(item.role || "Untitled role")}</div>
      <div class="hk-track-company">${esc(item.company || "No company")}</div>
      <div class="hk-track-meta">
        ${item.score ? `<span class="hk-pill hk-pill-${bandClass(item.score)}">${item.score}/100</span>` : ""}
        ${item.deadline ? `<span class="hk-pill">${esc(item.deadline)}</span>` : ""}
      </div>
      ${item.notes ? `<p class="hk-help hk-mb-2 hk-pre">${esc(item.notes)}</p>` : ""}
      <div class="hk-track-actions">
        <select class="hk-select" data-action="tracker-status" data-id="${attr(item.id)}" aria-label="Status for ${attr(item.role || "application")}">
          ${TRACKER_STATUSES.map((status) => `<option value="${status}" ${item.status === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
        ${item.kitId ? `<button type="button" class="hk-btn hk-btn-sm" data-action="open-tracker-kit" data-id="${attr(item.kitId)}">Open kit</button>` : ""}
        <button type="button" class="hk-icon-btn" data-action="delete-tracker" data-id="${attr(item.id)}" aria-label="Delete ${attr(item.role || "application")}" title="Delete">${ICON.trash}</button>
      </div>
    </article>
  `;
}

function renderSettings() {
  const cv = state.settingsCv ?? state.profile?.cv ?? state.cvText ?? "";
  const summary = state.summary || { kits: 0, tracker: 0 };
  return `
    <div class="hk-screen">
      <div class="hk-report-top">
        <div class="hk-report-title">
          <p class="hk-eyebrow">Settings</p>
          <h1 id="main-heading" tabindex="-1">Your workspace</h1>
          <p class="hk-help">Saved CV, defaults, privacy, and appearance.</p>
        </div>
        <button type="button" class="hk-btn" data-action="nav" data-nav="new">${ICON.arrowLeft}Back to new kit</button>
      </div>
      <div class="hk-settings-grid">
        <div class="hk-stack">
          <div class="hk-card hk-card-pad">
            <div class="hk-card-head">
              <div><h2>Saved CV</h2><p class="hk-help">This is prefilled for new kits. You can edit it per application on the new-kit screen.</p></div>
              <span class="hk-counter" data-counter="settings-cv">${wordCount(cv)} / ${MAX_CV_WORDS} words</span>
            </div>
            <textarea class="hk-textarea hk-textarea-cv" data-field="settings-cv" data-focus-key="settings-cv" placeholder="Paste your CV as text.">${esc(cv)}</textarea>
            <div class="hk-dialog-actions hk-actions-start">
              <button type="button" class="hk-btn hk-btn-primary" data-action="save-profile">Save CV and defaults</button>
            </div>
          </div>
          <div class="hk-card hk-card-pad">
            <h2>Defaults</h2>
            <div class="hk-options">
              <div class="hk-field">
                <label class="hk-label" for="profile-track">Track</label>
                <select class="hk-select" id="profile-track" data-field="track" data-focus-key="profile-track">
                  ${TRACKS.map((track) => `<option value="${attr(track)}" ${state.track === track ? "selected" : ""}>${esc(track)}</option>`).join("")}
                </select>
              </div>
              <div class="hk-field">
                <label class="hk-label" for="profile-level">Level</label>
                <select class="hk-select" id="profile-level" data-field="level" data-focus-key="profile-level">
                  ${LEVELS.map((level) => `<option value="${attr(level)}" ${state.level === level ? "selected" : ""}>${esc(level)}</option>`).join("")}
                </select>
              </div>
              <div class="hk-field">
                <label class="hk-label" for="profile-tone">Tone</label>
                <select class="hk-select" id="profile-tone" data-field="tone" data-focus-key="profile-tone">
                  ${TONES.map((tone) => `<option value="${attr(tone)}" ${state.tone === tone ? "selected" : ""}>${esc(tone)}</option>`).join("")}
                </select>
              </div>
            </div>
          </div>
        </div>
        <aside class="hk-stack">
          <div class="hk-card hk-card-pad">
            <h2>Data & privacy</h2>
            <div class="hk-kv"><span>Saved kits</span><strong>${summary.kits}</strong></div>
            <div class="hk-kv"><span>Tracker applications</span><strong>${summary.tracker}</strong></div>
            <div class="hk-kv"><span>Storage</span><strong>Anna storage</strong></div>
            <p class="hk-help hk-help-block">HireKit stores your CV, kits, and tracker in your Anna storage. It sends your CV and the job post to the model to build the kit. It does not post anywhere or email anyone.</p>
            <button type="button" class="hk-btn hk-btn-danger" data-action="delete-all">Delete everything</button>
          </div>
          <div class="hk-card hk-card-pad">
            <h2>Appearance</h2>
            <div class="hk-field">
              <label class="hk-label" for="theme-select">Theme</label>
              <select class="hk-select" id="theme-select" data-field="theme" data-focus-key="theme">
                <option value="system" ${state.settings.theme === "system" ? "selected" : ""}>System</option>
                <option value="dark" ${state.settings.theme === "dark" ? "selected" : ""}>Dark</option>
                <option value="light" ${state.settings.theme === "light" ? "selected" : ""}>Light</option>
              </select>
            </div>
          </div>
          <div class="hk-card hk-card-pad">
            <h2>Keyboard</h2>
            <div class="hk-kv"><span>Build kit</span><span><span class="hk-kbd">Ctrl</span> + <span class="hk-kbd">Enter</span></span></div>
            <div class="hk-kv"><span>Close dialog</span><span class="hk-kbd">Esc</span></div>
            <div class="hk-kv"><span>Move between tabs</span><span><span class="hk-kbd">←</span> <span class="hk-kbd">→</span></span></div>
            <div class="hk-kv"><span>Open settings</span><span class="hk-kbd">?</span></div>
          </div>
          <div class="hk-card hk-card-pad">
            <h2>About</h2>
            <p class="hk-help">HireKit v${APP_VERSION}. Evidence-first by design. If a claim cannot be traced to your CV, it is removed.</p>
            <p class="hk-help"><a href="https://forum.anna.partners/" target="_blank" rel="noreferrer">Report a problem on the Anna forum</a></p>
          </div>
        </aside>
      </div>
    </div>
  `;
}

function renderInlineEmpty(title, body) {
  return `<div class="hk-empty"><div class="hk-empty-icon">${ICON.info}</div><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`;
}

function renderEmpty(title, body, label, action, nav) {
  return `
    <div class="hk-screen">
      <div class="hk-empty">
        <div class="hk-empty-icon">${ICON.info}</div>
        <h1 id="main-heading" tabindex="-1" class="hk-h1-xs">${esc(title)}</h1>
        <p>${esc(body)}</p>
        <button type="button" class="hk-btn hk-btn-primary" data-action="${attr(action)}" ${nav ? `data-nav="${attr(nav)}"` : ""}>${esc(label)}</button>
      </div>
    </div>
  `;
}

function renderToast() {
  if (!state.toast) return "";
  return `
    <div class="hk-toast" role="status">
      <span>${esc(state.toast.message)}</span>
      ${state.toast.action ? `<button type="button" class="hk-btn hk-btn-sm" data-action="toast-action">${esc(state.toast.action.label)}</button>` : ""}
    </div>
  `;
}

function renderDialog() {
  if (!state.dialog) return "";
  const type = state.dialog.type;
  const data = state.dialog.data || {};
  let title = "";
  let body = "";
  let actions = "";
  if (type === "evidence") {
    title = "Add evidence";
    body = `
      <p class="hk-help hk-dialog-lead">Only add things that are true and can be quoted. This evidence will be used for the rebuild.</p>
      <div class="hk-form">
        <div class="hk-field"><label class="hk-label" for="ev-title">Title</label><input class="hk-input" id="ev-title" data-dialog-field="title" data-autofocus placeholder="Project or role name" /></div>
        <div class="hk-grid-2">
          <div class="hk-field"><label class="hk-label" for="ev-org">Organisation</label><input class="hk-input" id="ev-org" data-dialog-field="org" placeholder="Company, university, or self" /></div>
          <div class="hk-field"><label class="hk-label" for="ev-dates">Dates</label><input class="hk-input" id="ev-dates" data-dialog-field="dates" placeholder="2025" /></div>
        </div>
        <div class="hk-field"><label class="hk-label" for="ev-facts">Facts</label><textarea class="hk-textarea" id="ev-facts" rows="4" data-dialog-field="facts" placeholder="One fact per line. What did you build or do?"></textarea></div>
        <div class="hk-field"><label class="hk-label" for="ev-skills">Skills</label><input class="hk-input" id="ev-skills" data-dialog-field="skills" placeholder="Comma-separated, e.g. PostgreSQL, Docker" /></div>
        <div class="hk-field"><label class="hk-label" for="ev-quote">Source quote</label><textarea class="hk-textarea" id="ev-quote" rows="3" data-dialog-field="quote" placeholder="Paste the sentence from your CV or portfolio that proves this."></textarea><p class="hk-help">Required. HireKit will only use evidence with a source quote.</p></div>
      </div>
    `;
    actions = `<button type="button" class="hk-btn" data-action="close-dialog">Cancel</button><button type="button" class="hk-btn hk-btn-primary" data-action="save-evidence">Add and rebuild</button>`;
  } else if (type === "evidenceView") {
    const item = evidenceById(data.id);
    title = "Evidence";
    body = item ? `
      <div class="hk-stack">
        <div><h3 class="hk-mb-1">${esc(item.title)}</h3><p class="hk-help">${[item.org, item.dates, item.type].filter(Boolean).map(esc).join(" · ")}</p></div>
        ${item.facts?.length ? `<div><h4>Facts</h4><ul class="hk-outline">${item.facts.map((fact) => `<li>${esc(fact)}</li>`).join("")}</ul></div>` : ""}
        ${item.skills?.length ? `<div><h4>Skills</h4><div class="hk-chips">${item.skills.map((skill) => `<span class="hk-chip">${esc(skill)}</span>`).join("")}</div></div>` : ""}
        ${item.metrics?.length ? `<div><h4>Metrics</h4><div class="hk-chips">${item.metrics.map((metric) => `<span class="hk-chip hk-chip-ok">${esc(metric.text)}</span>`).join("")}</div></div>` : ""}
        ${item.links?.length ? `<div><h4>Links</h4><div class="hk-chips">${item.links.map((link) => {
          const url = safeUrl(link.url);
          return url ? `<a class="hk-chip" href="${attr(url)}" target="_blank" rel="noreferrer">${ICON.link}${esc(link.label || link.url)}</a>` : `<span class="hk-chip">${esc(link.label || link.url)}</span>`;
        }).join("")}</div></div>` : ""}
        <div><h4>Source quote</h4><p class="hk-quote">${esc(item.source_quote)}</p><p class="hk-help hk-mt-2">${item.verified_quote ? "Verified against your CV text." : "Not verified against your CV text."}</p></div>
      </div>
    ` : `<p class="hk-muted">That evidence item is not in this kit.</p>`;
    actions = `<button type="button" class="hk-btn hk-btn-primary" data-action="close-dialog">Close</button>`;
  } else if (type === "deleteAll") {
    title = "Delete everything?";
    body = `
      <p class="hk-muted">This deletes your saved CV, every kit, and your tracker from Anna storage. It cannot be undone.</p>
      <div class="hk-field hk-mt-4"><label class="hk-label" for="delete-confirm">Type DELETE to confirm</label><input class="hk-input" id="delete-confirm" data-dialog-field="confirm" data-autofocus autocomplete="off" /></div>
    `;
    actions = `<button type="button" class="hk-btn" data-action="close-dialog">Cancel</button><button type="button" class="hk-btn hk-btn-danger" data-action="confirm-delete-all" data-confirm-delete disabled>Delete everything</button>`;
  } else if (type === "addApp") {
    title = "Add application";
    body = `
      <div class="hk-form">
        <div class="hk-field"><label class="hk-label" for="app-role">Role</label><input class="hk-input" id="app-role" data-dialog-field="role" data-autofocus placeholder="Junior Backend Engineer" /></div>
        <div class="hk-field"><label class="hk-label" for="app-company">Company</label><input class="hk-input" id="app-company" data-dialog-field="company" placeholder="Northwind Payments" /></div>
        <div class="hk-grid-2">
          <div class="hk-field"><label class="hk-label" for="app-status">Status</label><select class="hk-select" id="app-status" data-dialog-field="status">${TRACKER_STATUSES.map((status) => `<option value="${status}">${status}</option>`).join("")}</select></div>
          <div class="hk-field"><label class="hk-label" for="app-score">Fit score (optional)</label><input class="hk-input" id="app-score" data-dialog-field="score" type="number" min="0" max="100" placeholder="78" /></div>
        </div>
        <div class="hk-field"><label class="hk-label" for="app-deadline">Deadline or next step</label><input class="hk-input" id="app-deadline" data-dialog-field="deadline" placeholder="Closes Nov 20" /></div>
        <div class="hk-field"><label class="hk-label" for="app-notes">Notes</label><textarea class="hk-textarea" id="app-notes" rows="3" data-dialog-field="notes" placeholder="Referral, recruiter name, next round…"></textarea></div>
      </div>
    `;
    actions = `<button type="button" class="hk-btn" data-action="close-dialog">Cancel</button><button type="button" class="hk-btn hk-btn-primary" data-action="save-app">Add application</button>`;
  } else if (type === "answer") {
    const question = (state.current?.kit?.needs_input || []).find((item) => item.id === data.qid);
    title = "Answer question";
    body = `
      <p class="hk-small hk-mb-3">${esc(question?.question || data.question || "")}</p>
      <div class="hk-field"><label class="hk-label" for="answer-text">Your true answer</label><textarea class="hk-textarea" id="answer-text" rows="4" data-dialog-field="answer" data-autofocus placeholder="Only state what actually happened.">${esc(data.answer || "")}</textarea></div>
    `;
    actions = `<button type="button" class="hk-btn" data-action="close-dialog">Cancel</button><button type="button" class="hk-btn hk-btn-primary" data-action="save-answer">Save and rebuild</button>`;
  } else if (type === "number") {
    title = "Add a real number";
    body = `
      <p class="hk-small hk-mb-3">${esc(data.bullet || "")}</p>
      <div class="hk-field"><label class="hk-label" for="number-value">Number or metric</label><input class="hk-input" id="number-value" data-dialog-field="value" data-autofocus placeholder="e.g. 74% test coverage, 9 tables, 2k requests/day" /><p class="hk-help">Only add a number you can prove. If you cannot, leave it out.</p></div>
    `;
    actions = `<button type="button" class="hk-btn" data-action="close-dialog">Cancel</button><button type="button" class="hk-btn hk-btn-primary" data-action="save-number">Save and rebuild</button>`;
  } else {
    return "";
  }
  return `
    <div class="hk-overlay" data-action="close-dialog">
      <div class="hk-dialog ${type === "deleteAll" ? "hk-dialog-danger" : ""}" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div class="hk-dialog-head">
          <h2 id="dialog-title">${esc(title)}</h2>
          <button type="button" class="hk-icon-btn" data-action="close-dialog" aria-label="Close dialog">${ICON.close}</button>
        </div>
        ${body}
        <div class="hk-dialog-actions">${actions}</div>
      </div>
    </div>
  `;
}

function showToast(message, action = null) {
  state.toast = { message, action };
  updateToastRegion();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state.toast = null;
    if (action?.action === "undo-delete") state.undo = null;
    updateToastRegion();
  }, 4600);
}

function updateToastRegion() {
  const region = document.getElementById("toast-region");
  if (region) region.innerHTML = renderToast();
}

function updateCounter(kind) {
  const counter = appEl.querySelector(`[data-counter="${kind}"]`);
  if (!counter) return;
  const text = kind === "job" ? state.jobText : kind === "cv" ? state.cvText : state.settingsCv ?? state.cvText;
  const max = kind === "job" ? MAX_JOB_WORDS : MAX_CV_WORDS;
  const count = wordCount(text);
  counter.textContent = `${count} / ${max} words`;
  counter.classList.toggle("is-over", count > max);
}

function navigate(screen) {
  if (screen === "report" || screen === "kit") {
    if (!state.current) {
      showToast("Build a kit first.");
      return;
    }
    if (screen === "kit" && !state.current.kit) {
      showToast("Your kit did not finish. Retry first.");
      return;
    }
  }
  if (screen === "settings") state.settingsCv = state.profile?.cv ?? state.cvText ?? "";
  state.screen = screen;
  state.banner = null;
  state.focusMain = true;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateInputs() {
  const errors = {};
  const jobWords = wordCount(state.jobText);
  const cvWords = wordCount(state.cvText);
  if (jobWords < 30) errors.job = "Paste at least 30 words from the job post.";
  else if (jobWords > MAX_JOB_WORDS) errors.job = `Shorten the job post to ${MAX_JOB_WORDS} words or fewer.`;
  if (cvWords < 40) errors.cv = "Paste at least 40 words from your CV.";
  else if (cvWords > MAX_CV_WORDS) errors.cv = `Shorten your CV to ${MAX_CV_WORDS} words or fewer.`;
  return errors;
}

async function buildKit() {
  if (state.busy) return;
  const errors = validateInputs();
  state.formErrors = errors;
  if (Object.keys(errors).length) {
    state.screen = "new";
    render();
    const first = appEl.querySelector('[aria-invalid="true"]');
    if (first) first.focus();
    return;
  }
  const token = ++state.runToken;
  const jobText = state.jobText.trim();
  const cvText = state.cvText.trim();
  const inputs = { jobText, cvText, track: state.track, level: state.level, tone: state.tone };
  state.busy = true;
  state.screen = "progress";
  state.progress = { statuses: STAGES.map((stage) => ({ ...stage, status: "pending" })), error: null };
  state.banner = null;
  state.focusMain = true;
  render();
  try {
    const result = await pipeline.run({
      cvText,
      jobText,
      tone: `${state.tone.toLowerCase()}, warm, specific. Target track: ${state.track}.`,
      level: state.level.toLowerCase(),
      answers: [],
      onProgress: (statuses) => {
        if (token !== state.runToken) return;
        state.progress.statuses = statuses;
        if (state.screen === "progress") render();
      },
    });
    if (token !== state.runToken) return;
    const snapshot = {
      id: `k_${Date.now()}`,
      createdAt: new Date().toISOString(),
      evidence: result.evidence,
      job: result.job,
      matches: result.matches,
      kit: result.kit,
      lint: result.lint,
      inputs,
      answers: result.answers || [],
      originalLetter: clone(result.kit?.cover_letter || null),
      partial: false,
    };
    state.current = snapshot;
    state.lastKit = snapshot;
    state.profile = {
      ...(state.profile || {}),
      cv: cvText,
      track: state.track,
      level: state.level,
      tone: state.tone,
      updatedAt: snapshot.createdAt,
    };
    state.busy = false;
    state.progress = null;
    state.screen = "report";
    state.focusMain = true;
    try {
      await Promise.all([store.saveKit(snapshot), store.saveProfile(state.profile)]);
      await refreshSummary();
    } catch {
      /* banner is set by Store.onError */
    }
    render();
    window.scrollTo(0, 0);
    showToast("Kit ready. Every claim is linked to your CV.");
  } catch (err) {
    if (token !== state.runToken) return;
    state.busy = false;
    const partial = err.partial || {};
    const error = {
      code: err.code || "TOOL_ERROR",
      message: err.message || "Something went wrong. Try again.",
      retryable: err.retryable !== false,
      stage: err.stage,
      hasPartial: Boolean(partial.matches),
    };
    if (partial.matches) {
      state.current = {
        id: `k_partial_${Date.now()}`,
        createdAt: new Date().toISOString(),
        evidence: partial.evidence || null,
        job: partial.job || null,
        matches: partial.matches,
        kit: null,
        lint: [],
        inputs,
        answers: [],
        originalLetter: null,
        partial: true,
        error,
      };
      state.progress = null;
      state.screen = "report";
      state.focusMain = true;
      render();
      window.scrollTo(0, 0);
      showToast("Report is ready. The kit did not finish.");
    } else {
      state.progress = { statuses: state.progress?.statuses || STAGES.map((stage) => ({ ...stage, status: "pending" })), error };
      state.screen = "progress";
      render();
    }
  }
}

function cancelRun() {
  state.runToken += 1;
  state.busy = false;
  state.progress = null;
  state.screen = "new";
  state.focusMain = true;
  render();
  showToast("Cancelled. Your inputs are safe.");
}

async function rebuildCurrent() {
  const current = state.current;
  if (!current?.job || !current?.evidence) {
    showToast("Build a kit first.");
    return;
  }
  if (state.busy) return;
  state.busy = true;
  state.banner = { kind: "info", message: "Rebuilding your kit with the new evidence…", actions: [] };
  render();
  try {
    const matches = await pipeline.call("match", { job: current.job, evidence: current.evidence });
    const draft = await pipeline.call("generate", {
      job: current.job,
      matches,
      evidence: current.evidence,
      answers: current.answers || [],
      tone: `${(current.inputs?.tone || state.tone).toLowerCase()}, warm, specific. Target track: ${current.inputs?.track || state.track}.`,
      level: (current.inputs?.level || state.level).toLowerCase(),
    });
    const final = await pipeline.call("verify", { evidence: current.evidence, job: current.job, matches, kit: draft });
    state.current = {
      ...current,
      matches,
      kit: final.kit,
      lint: final.lint || [],
      originalLetter: clone(final.kit?.cover_letter || null),
      partial: false,
      error: null,
    };
    state.banner = null;
    await store.saveKit(state.current);
    await refreshSummary();
    render();
    showToast("Kit rebuilt.");
  } catch (err) {
    state.banner = { kind: "error", message: err.message || "Could not rebuild the kit.", actions: [{ label: "Retry", action: "rebuild" }] };
    render();
  } finally {
    state.busy = false;
  }
}

async function saveCurrentToTracker() {
  if (!state.current?.kit) {
    showToast("Finish the kit before saving it.");
    return;
  }
  const existing = state.tracker.find((item) => item.kitId === state.current.id);
  if (existing) {
    showToast("Already in your tracker.", { label: "Open tracker", action: "nav-tracker" });
    return;
  }
  const item = {
    id: `t_${Date.now()}`,
    role: state.current.job?.title || "Untitled role",
    company: state.current.job?.company || "",
    status: "Saved",
    score: state.current.kit.fit?.score ?? 0,
    deadline: state.current.job?.deadline || "",
    notes: "",
    kitId: state.current.id,
    createdAt: new Date().toISOString(),
  };
  state.tracker = [item, ...state.tracker];
  await persistTracker();
  render();
  showToast("Saved to tracker.", { label: "View", action: "nav-tracker" });
}

async function persistTracker() {
  try {
    await store.saveTracker(state.tracker);
    await refreshSummary();
  } catch {
    /* banner is set by Store.onError */
  }
}

async function refreshSummary() {
  try {
    state.summary = await store.dataSummary();
  } catch {
    state.summary = { kits: 0, tracker: state.tracker.length };
  }
}

function deleteTrackerItem(id) {
  const index = state.tracker.findIndex((item) => item.id === id);
  if (index < 0) return;
  const item = state.tracker[index];
  state.tracker = state.tracker.filter((entry) => entry.id !== id);
  state.undo = { type: "tracker", item, index };
  persistTracker().then(() => {
    render();
    showToast("Application removed.", { label: "Undo", action: "undo-delete" });
  });
}

function undoDelete() {
  if (!state.undo) return;
  if (state.undo.type === "tracker") {
    const next = [...state.tracker];
    next.splice(state.undo.index, 0, state.undo.item);
    state.tracker = next;
    state.undo = null;
    persistTracker().then(() => {
      render();
      showToast("Restored.");
    });
  }
}

async function loadTrackerKit(id) {
  try {
    const snapshot = await store.loadKit(id);
    if (!snapshot) {
      showToast("That kit is no longer saved.");
      return;
    }
    if (snapshot.kit && !snapshot.originalLetter) snapshot.originalLetter = clone(snapshot.kit.cover_letter || null);
    state.current = snapshot;
    state.lastKit = snapshot;
    state.screen = "report";
    state.focusMain = true;
    state.banner = null;
    render();
  } catch {
    showToast("Could not open that kit.");
  }
}

function saveLetterEdit() {
  if (!state.current?.kit) return;
  const paragraphs = state.letterDraft
    .split(/\n\s*\n/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, index, all) => ({
      text,
      kind: index === 0 ? "greeting" : index === all.length - 1 ? "closing" : "body",
      evidence_ids: [],
    }));
  state.current.kit.cover_letter = { paragraphs };
  state.current.letterEdited = true;
  state.editingLetter = false;
  store.saveKit(state.current).catch(() => {});
  render();
  showToast("Letter saved. Manual edits are not claim-checked.");
}

function restoreLetter() {
  if (!state.current?.kit) return;
  if (!state.current.originalLetter) {
    showToast("No generated letter to restore.");
    return;
  }
  state.current.kit.cover_letter = clone(state.current.originalLetter);
  state.current.letterEdited = false;
  store.saveKit(state.current).catch(() => {});
  render();
  showToast("Generated letter restored.");
}

async function copyText(text, label) {
  if (!text) {
    showToast("Nothing to copy.");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast(`${label} copied.`);
    return;
  } catch {
    if (fallbackCopy(text)) {
      showToast(`${label} copied.`);
    } else {
      showToast("Copy is blocked in this window. Select the text and copy it.");
    }
  }
}

function fallbackCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  return copied;
}

function letterText(kit) {
  return (kit.cover_letter?.paragraphs || []).map((paragraph) => paragraph.text).join("\n\n");
}

function kitToMarkdown(current) {
  const kit = current.kit || {};
  const job = current.job || {};
  const fit = kit.fit || {};
  const reqMap = new Map((job.requirements || []).map((req) => [req.id, req]));
  const lines = [];
  lines.push(`# Application kit — ${job.title || "Role"}${job.company ? ` at ${job.company}` : ""}`);
  lines.push("");
  lines.push(`Fit: ${fit.score ?? 0}/100 (${fit.band || "Unrated"})`);
  if (fit.summary) lines.push("", fit.summary);
  lines.push("", "## Resume bullets");
  (kit.bullets || []).forEach((bullet) => {
    lines.push(`- ${bullet.text}`);
    if (bullet.evidence_ids?.length) lines.push(`  Evidence: ${bullet.evidence_ids.join(", ")}`);
  });
  lines.push("", "## Cover letter", "");
  lines.push(letterText(kit) || "_No letter generated._");
  lines.push("", "## Recruiter outreach");
  lines.push(`Subject: ${kit.outreach?.subject || ""}`, "", kit.outreach?.message || "");
  lines.push("", "## Interview prep");
  (kit.interview || []).forEach((item) => {
    lines.push("", `### ${item.question}`);
    if (item.why_asked) lines.push(`Why: ${item.why_asked}`);
    (item.answer_outline || []).forEach((point) => lines.push(`- ${point}`));
    if (item.evidence_ids?.length) lines.push(`Evidence: ${item.evidence_ids.join(", ")}`);
  });
  lines.push("", "## Gap plan");
  (kit.gap_plan || []).forEach((item) => {
    const req = reqMap.get(item.requirement_id);
    lines.push(`- ${req?.text || item.requirement_id}: ${item.honest_phrasing || ""}`);
    if (item.action) lines.push(`  Action: ${item.action}`);
    if (item.effort) lines.push(`  Effort: ${item.effort}`);
  });
  if (kit.needs_input?.length) {
    lines.push("", "## Questions before sending");
    kit.needs_input.forEach((question) => lines.push(`- ${question.question}`));
  }
  lines.push("", "## Evidence index");
  (current.evidence?.items || []).forEach((item) => {
    lines.push(`- ${item.id}: ${item.title}${item.org ? `, ${item.org}` : ""}`);
    if (item.source_quote) lines.push(`  Quote: ${item.source_quote}`);
  });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

function downloadKit() {
  if (!state.current?.kit) return;
  const text = kitToMarkdown(state.current);
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safe = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  anchor.href = url;
  anchor.download = `hirekit-${safe(state.current.job?.company)}-${safe(state.current.job?.title)}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Kit downloaded.");
}

function openDialog(type, data = {}) {
  const active = document.activeElement;
  state.returnFocus = active && appEl.contains(active) ? { key: active.dataset?.focusKey || "", id: active.id || "" } : null;
  state.dialog = { type, data };
  render();
}

function closeDialog() {
  state.dialog = null;
  render();
  const target = state.returnFocus;
  state.returnFocus = null;
  if (target) {
    const el = target.key ? appEl.querySelector(`[data-focus-key="${target.key.replace(/"/g, '\\"')}"]`) : target.id ? document.getElementById(target.id) : null;
    if (el) el.focus({ preventScroll: true });
  }
}

async function saveEvidence() {
  const data = state.dialog?.data || {};
  const title = String(data.title || "").trim();
  const facts = String(data.facts || "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const skills = String(data.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean);
  const quote = String(data.quote || "").trim();
  if (!title || !facts.length || !quote) {
    showToast("Add a title, at least one fact, and the source quote.");
    return;
  }
  if (!state.current?.evidence) {
    showToast("Build a kit first.");
    return;
  }
  const item = {
    id: `manual_${Date.now()}`,
    type: "project",
    title,
    org: String(data.org || "").trim(),
    dates: String(data.dates || "").trim(),
    facts,
    skills,
    stack: skills,
    links: [],
    metrics: [],
    source_quote: quote,
    verified_quote: true,
  };
  state.current.evidence.items = [...(state.current.evidence.items || []), item];
  closeDialog();
  await rebuildCurrent();
}

async function saveApp() {
  const data = state.dialog?.data || {};
  const role = String(data.role || "").trim();
  if (!role) {
    showToast("Add a role name.");
    return;
  }
  const score = Number.parseInt(String(data.score || ""), 10);
  const item = {
    id: `t_${Date.now()}`,
    role,
    company: String(data.company || "").trim(),
    status: TRACKER_STATUSES.includes(data.status) ? data.status : "Saved",
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0,
    deadline: String(data.deadline || "").trim(),
    notes: String(data.notes || "").trim(),
    kitId: "",
    createdAt: new Date().toISOString(),
  };
  state.tracker = [item, ...state.tracker];
  closeDialog();
  await persistTracker();
  state.trackerFilter = "all";
  render();
  showToast("Application added.");
}

async function saveAnswer() {
  const data = state.dialog?.data || {};
  const qid = data.qid;
  const answer = String(data.answer || "").trim();
  if (!qid || !answer) {
    showToast("Write an answer first.");
    return;
  }
  const question = (state.current?.kit?.needs_input || []).find((item) => item.id === qid);
  state.current.answers = [
    ...(state.current.answers || []).filter((item) => item.question_id !== qid),
    { question_id: qid, question: question?.question || data.question || "", answer },
  ];
  closeDialog();
  await rebuildCurrent();
}

async function saveNumber() {
  const data = state.dialog?.data || {};
  const value = String(data.value || "").trim();
  if (!value) {
    showToast("Add a real number first.");
    return;
  }
  const index = Number(data.index);
  const bullet = state.current?.kit?.bullets?.[index];
  const qid = `q_number_${index}`;
  state.current.answers = [
    ...(state.current.answers || []).filter((item) => item.question_id !== qid),
    { question_id: qid, question: `What is the real number for this bullet: ${bullet?.text || ""}`, answer: value },
  ];
  closeDialog();
  await rebuildCurrent();
}

async function submitNeedsAnswers() {
  const questions = state.current?.kit?.needs_input || [];
  const answers = Object.entries(state.needsAnswers || {})
    .filter(([, value]) => String(value || "").trim())
    .map(([qid, answer]) => ({
      question_id: qid,
      question: questions.find((question) => question.id === qid)?.question || "",
      answer: String(answer).trim(),
    }));
  if (!answers.length) return;
  const answered = new Set(answers.map((answer) => answer.question_id));
  state.current.answers = [...(state.current.answers || []).filter((answer) => !answered.has(answer.question_id)), ...answers];
  state.needsAnswers = {};
  await rebuildCurrent();
}

async function saveProfile() {
  const cv = String(state.settingsCv ?? state.cvText ?? "").trim();
  state.cvText = cv;
  state.profile = {
    ...(state.profile || {}),
    cv,
    track: state.track,
    level: state.level,
    tone: state.tone,
    updatedAt: new Date().toISOString(),
  };
  try {
    await store.saveProfile(state.profile);
    await refreshSummary();
    render();
    showToast("Saved.");
  } catch {
    render();
    showToast("Could not save. Try again.");
  }
}

async function deleteEverything() {
  try {
    await store.deleteAll();
  } catch {
    /* still reset the UI */
  }
  state.profile = null;
  state.tracker = [];
  state.current = null;
  state.lastKit = null;
  state.cvText = "";
  state.jobText = "";
  state.settings = { theme: "system" };
  state.settingsCv = "";
  state.summary = { kits: 0, tracker: 0 };
  state.screen = "new";
  state.dialog = null;
  state.banner = null;
  state.formErrors = {};
  state.needsAnswers = {};
  state.editingLetter = false;
  applyTheme();
  render();
  showToast("Everything deleted.");
}

function cycleTheme() {
  const order = ["system", "dark", "light"];
  const current = state.settings.theme || "system";
  const next = order[(order.indexOf(current) + 1) % order.length];
  state.settings = { ...state.settings, theme: next };
  applyTheme();
  store.saveSettings(state.settings).catch(() => {});
  render();
  showToast(`Theme: ${next[0].toUpperCase()}${next.slice(1)}.`);
}

function applyTheme() {
  const theme = state.settings?.theme || "system";
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}

function handleClick(event) {
  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  if (action === "close-dialog") {
    if (event.target === actionEl || !event.target.closest(".hk-dialog")) closeDialog();
    return;
  }
  if (action === "nav") {
    navigate(actionEl.dataset.nav);
    return;
  }
  if (action === "build" || action === "retry") {
    buildKit();
    return;
  }
  if (action === "cancel") {
    cancelRun();
    return;
  }
  if (action === "view-report") {
    state.screen = "report";
    state.focusMain = true;
    render();
    return;
  }
  if (action === "tab") {
    state.kitTab = actionEl.dataset.tab || "resume";
    render();
    return;
  }
  if (action === "copy-kit") {
    copyText(kitToMarkdown(state.current), "Kit");
    return;
  }
  if (action === "download-kit") {
    downloadKit();
    return;
  }
  if (action === "save-tracker") {
    saveCurrentToTracker();
    return;
  }
  if (action === "evidence") {
    openDialog("evidenceView", { id: actionEl.dataset.id });
    return;
  }
  if (action === "add-evidence") {
    openDialog("evidence", {});
    return;
  }
  if (action === "save-evidence") {
    saveEvidence();
    return;
  }
  if (action === "add-app") {
    openDialog("addApp", { status: "Saved" });
    return;
  }
  if (action === "save-app") {
    saveApp();
    return;
  }
  if (action === "delete-tracker") {
    deleteTrackerItem(actionEl.dataset.id);
    return;
  }
  if (action === "undo-delete") {
    undoDelete();
    return;
  }
  if (action === "open-tracker-kit") {
    loadTrackerKit(actionEl.dataset.id);
    return;
  }
  if (action === "filter") {
    state.trackerFilter = actionEl.dataset.filter || actionEl.dataset.nav || "all";
    render();
    return;
  }
  if (action === "theme") {
    cycleTheme();
    return;
  }
  if (action === "save-profile") {
    saveProfile();
    return;
  }
  if (action === "delete-all") {
    openDialog("deleteAll", {});
    return;
  }
  if (action === "confirm-delete-all") {
    deleteEverything();
    return;
  }
  if (action === "dismiss-banner") {
    state.banner = null;
    state.storageError = false;
    render();
    return;
  }
  if (action === "rebuild") {
    rebuildCurrent();
    return;
  }
  if (action === "needs-update") {
    submitNeedsAnswers();
    return;
  }
  if (action === "add-number") {
    const index = Number(actionEl.dataset.index);
    const bullet = state.current?.kit?.bullets?.[index];
    openDialog("number", { index, bullet: bullet?.text || "" });
    return;
  }
  if (action === "save-number") {
    saveNumber();
    return;
  }
  if (action === "save-answer") {
    saveAnswer();
    return;
  }
  if (action === "edit-letter") {
    state.editingLetter = true;
    state.letterDraft = letterText(state.current?.kit || {});
    render();
    return;
  }
  if (action === "cancel-letter") {
    state.editingLetter = false;
    render();
    return;
  }
  if (action === "save-letter") {
    saveLetterEdit();
    return;
  }
  if (action === "restore-letter") {
    restoreLetter();
    return;
  }
  if (action === "copy-letter") {
    copyText(letterText(state.current?.kit || {}), "Letter");
    return;
  }
  if (action === "copy-outreach") {
    const outreach = state.current?.kit?.outreach || {};
    copyText(`Subject: ${outreach.subject || ""}\n\n${outreach.message || ""}`.trim(), "Message");
    return;
  }
  if (action === "toast-action") {
    const toastAction = state.toast?.action;
    state.toast = null;
    updateToastRegion();
    if (toastAction?.action === "nav-tracker") navigate("tracker");
    else if (toastAction?.action === "undo-delete") undoDelete();
    return;
  }
}

function handleInput(event) {
  const field = event.target.dataset.field;
  if (field === "job") {
    state.jobText = event.target.value;
    updateCounter("job");
    return;
  }
  if (field === "cv") {
    state.cvText = event.target.value;
    updateCounter("cv");
    return;
  }
  if (field === "settings-cv") {
    state.settingsCv = event.target.value;
    updateCounter("settings-cv");
    return;
  }
  if (field === "needs-answer") {
    const qid = event.target.dataset.qid;
    state.needsAnswers[qid] = event.target.value;
    const button = appEl.querySelector('[data-action="needs-update"]');
    if (button) button.disabled = !Object.values(state.needsAnswers).some((value) => String(value || "").trim());
    return;
  }
  if (field === "letter-draft") {
    state.letterDraft = event.target.value;
    return;
  }
  const dialogField = event.target.dataset.dialogField;
  if (dialogField) {
    if (!state.dialog) return;
    state.dialog.data = { ...state.dialog.data, [dialogField]: event.target.value };
    if (dialogField === "confirm") {
      const button = appEl.querySelector("[data-confirm-delete]");
      if (button) button.disabled = event.target.value.trim().toUpperCase() !== "DELETE";
    }
  }
}

function handleChange(event) {
  const field = event.target.dataset.field;
  if (field === "track") {
    state.track = event.target.value;
    return;
  }
  if (field === "level") {
    state.level = event.target.value;
    return;
  }
  if (field === "tone") {
    state.tone = event.target.value;
    return;
  }
  if (field === "theme") {
    const theme = event.target.value;
    if (!["system", "dark", "light"].includes(theme)) return;
    state.settings = { ...state.settings, theme };
    applyTheme();
    store.saveSettings(state.settings).catch(() => {});
    return;
  }
  const dialogField = event.target.dataset.dialogField;
  if (dialogField) {
    if (!state.dialog) return;
    state.dialog.data = { ...state.dialog.data, [dialogField]: event.target.value };
    return;
  }
  const action = event.target.dataset.action;
  if (action === "tracker-status") {
    const id = event.target.dataset.id;
    const status = event.target.value;
    if (!TRACKER_STATUSES.includes(status)) return;
    state.tracker = state.tracker.map((item) => (item.id === id ? { ...item, status } : item));
    persistTracker().then(() => {
      render();
      showToast("Status updated.");
    });
  }
}

function trapDialogFocus(event) {
  if (!state.dialog) return;
  const dialog = appEl.querySelector(".hk-dialog");
  if (!dialog) return;
  const focusable = Array.from(dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function handleKeyDown(event) {
  if (state.dialog) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key === "Tab") trapDialogFocus(event);
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && state.screen === "new") {
    event.preventDefault();
    buildKit();
    return;
  }
  if (event.key === "?" && !["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) {
    event.preventDefault();
    navigate("settings");
    return;
  }
  if (event.target.getAttribute("role") === "tab" && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    const tabs = ["resume", "letter", "outreach", "interview", "gap"];
    let index = tabs.indexOf(state.kitTab);
    if (event.key === "ArrowLeft") index = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight") index = (index + 1) % tabs.length;
    if (event.key === "Home") index = 0;
    if (event.key === "End") index = tabs.length - 1;
    state.kitTab = tabs[index];
    render();
    const next = document.getElementById(`tab-${state.kitTab}`);
    if (next) next.focus();
  }
}

async function connectHost() {
  const isEmbedded = typeof window !== "undefined" && window.parent && window.parent !== window;
  if (!isEmbedded) return null;
  try {
    const sdk = await import("/static/anna-apps/_sdk/latest/index.js");
    if (!sdk?.AnnaAppRuntime) return null;
    return await sdk.AnnaAppRuntime.connect();
  } catch {
    return null;
  }
}

function handleStorageError(error, operation) {
  state.storageError = true;
  if (state.ready) {
    state.banner = {
      kind: "error",
      message: "Could not save to Anna storage. Your kit is still on screen. Copy it now if you need it.",
      actions: [{ label: "Dismiss", action: "dismiss-banner" }],
    };
    render();
  }
}

async function init() {
  host = await connectHost();
  state.demo = !host;
  store = new Store(host, { onError: handleStorageError });
  pipeline = new Pipeline({ host, toolId: TOOL_ID, demo: state.demo });
  let data = { profile: null, settings: {}, tracker: [], lastKit: null };
  try {
    data = await store.load();
  } catch {
    state.storageError = true;
  }
  state.profile = data.profile || null;
  state.settings = { theme: "system", ...(data.settings || {}) };
  state.tracker = Array.isArray(data.tracker) && data.tracker.length
    ? data.tracker
    : state.demo
      ? clone(SAMPLE.tracker)
      : [];
  if (state.demo && !data.tracker?.length) {
    try {
      await store.saveTracker(state.tracker);
    } catch {
      /* preview storage may be unavailable */
    }
  }
  state.lastKit = data.lastKit || null;
  state.current = data.lastKit || null;
  if (data.lastKit?.kit && !data.lastKit.originalLetter) {
    data.lastKit.originalLetter = clone(data.lastKit.kit.cover_letter || null);
  }
  if (data.lastKit?.inputs) {
    state.jobText = data.lastKit.inputs.jobText || "";
    state.cvText = data.lastKit.inputs.cvText || "";
    state.track = data.lastKit.inputs.track || state.track;
    state.level = data.lastKit.inputs.level || state.level;
    state.tone = data.lastKit.inputs.tone || state.tone;
  } else if (state.demo) {
    state.jobText = SAMPLE.jobText;
    state.cvText = SAMPLE.cvText;
  } else {
    state.cvText = state.profile?.cv || "";
  }
  if (state.profile) {
    state.track = state.profile.track || state.track;
    state.level = state.profile.level || state.level;
    state.tone = state.profile.tone || state.tone;
    if (!state.cvText) state.cvText = state.profile.cv || "";
  }
  applyTheme();
  await refreshSummary();
  state.ready = true;
  render();
  if (host?.window?.set_title) {
    try {
      await host.window.set_title({ title: "HireKit" });
    } catch {
      /* ignore */
    }
  }
}

appEl.addEventListener("click", handleClick);
appEl.addEventListener("input", handleInput);
appEl.addEventListener("change", handleChange);
appEl.addEventListener("keydown", handleKeyDown);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.dialog) closeDialog();
});
window.addEventListener("online", () => render());
window.addEventListener("offline", () => render());

init();

appEl.addEventListener("submit", (event) => event.preventDefault());
