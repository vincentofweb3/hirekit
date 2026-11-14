#!/usr/bin/env python3
"""Check (and repair) the Cloud Agent install state of the HireKit Anna App.

Usage:
    python3 app/scripts/cloud_status.py            # read-only status
    python3 app/scripts/cloud_status.py --reconcile # also ask the platform to
                                                    # re-assert the desired
                                                    # tool state for enabled apps

Never prints the PAT.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

HOST = "https://anna.partners"
APP_ID = 833
TOOL_ID = "tool-victoribiloju111_6541-hirekit-gg43q8r8"
CREDS = os.path.expanduser("~/.config/anna/credentials.json")


def pat() -> str:
    data = json.load(open(CREDS, encoding="utf-8"))
    return data["accounts"][HOST]["pat"]


def request(path: str, method: str = "GET", body: dict | None = None):
    payload = json.dumps(body).encode() if body is not None else None
    headers = {
        "authorization": f"Bearer {pat()}",
        "user-agent": "anna-app-cli",
        "accept": "application/json",
    }
    if payload:
        headers["content-type"] = "application/json"
    req = urllib.request.Request(HOST + path, data=payload, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=45) as res:
            raw = res.read().decode()
            return res.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode()[:300]


def main() -> int:
    reconcile = "--reconcile" in sys.argv

    status, agents = request("/api/v1/agents")
    print("== Cloud Agent ==")
    for agent in (agents or {}).get("agents", []):
        print(
            f"  {agent.get('agent_name')} cloud_status={agent.get('cloud_status')} "
            f"online={agent.get('is_online')} last_seen={agent.get('last_seen_at')}"
        )
    online = any(a.get("is_online") for a in (agents or {}).get("agents", []))
    if not online:
        print("  -> agent is suspended/asleep; it must be online before tools can run")

    status, installed = request("/api/v1/apps/installed")
    print("\n== Installed apps ==")
    for app in installed or []:
        if app.get("slug") not in ("hirekit", "executa-tool-dev-hirekit"):
            continue
        executas = app.get("executas") or []
        print(
            f"  {app.get('slug')}: installed_version={app.get('installed_version')} "
            f"deploy_status={app.get('deploy_status')} executas={[e.get('tool_id') for e in executas]}"
        )

    status, app = request(f"/api/v1/developer/apps/{APP_ID}")
    print("\n== App ==")
    print(f"  status={app.get('status')} latest={app.get('latest_version')} "
          f"installable={app.get('installable_version')}")
    print(f"  versions={[v.get('version') for v in app.get('versions', [])]}")

    if reconcile:
        status, body = request("/api/v1/anna-apps/runtime/executas/reconcile", "POST", {})
        print("\n== reconcile ==")
        print(f"  HTTP {status}: {body}")

        status, installed = request("/api/v1/apps/installed")
        for app in installed or []:
            if app.get("slug") == "hirekit":
                executas = [e.get("tool_id") for e in (app.get("executas") or [])]
                print(f"  hirekit executas now: {executas}")
                print("  -> READY" if TOOL_ID in executas else "  -> tool still NOT attached")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
