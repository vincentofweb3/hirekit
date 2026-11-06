# Anna platform notes for HireKit

Last verified: 2026-11-04 against `@anna-ai/cli 0.1.63`, `anna-app-runtime-local 0.2.0a32`, and the live docs.

## Architecture choices

- **Bundle:** static SPA in `app/bundle/`, sandboxed iframe, host SDK from `/static/anna-apps/_sdk/latest/index.js`.
- **Executa:** Python stdio JSON-RPC plugin in `app/executas/hirekit/`. Protocol v2: `initialize` returns `protocolVersion: "2.0"` and `capabilities.sampling = {}`.
- **Primary run:** the UI calls the bundled Executa through `anna.tools.invoke`. The Executa calls the host LLM through reverse-RPC `sampling/createMessage`. The host records the run server-side; the user needs no API key.
- **Why split the pipeline:** sampling caps are per `invoke_id` (8 calls, 32,000 tokens). A 6,000-word CV + 4,000-word job exceeds one budget. The UI orchestrates five invokes: `parse_cv`, `parse_job`, `match`, `generate`, `verify`. Each invoke gets a fresh budget and a progress stage; `parse_cv` and `parse_job` can run in parallel, and `verify` finalizes fit/lint/gaps.
- **Storage:** iframe `anna.storage.*` with schema-3 `storage.kv`. Default app scope needs no user grant. Do not use Executa APS storage: it is opt-in per user.
- **UI storage keys:** `hirekit/profile`, `hirekit/settings`, `hirekit/tracker`, `hirekit/kits/index`, `hirekit/kits/<id>`, `hirekit/last` — split to stay under the legacy 256 KiB per-key budget; the index keeps 20 entries and stale kit records are deleted on save.
- **SDK timeouts:** the SDK default for `tools.invoke` is **70 s**. The bundle passes `{ timeoutMs: 65000/50000/50000/90000/65000 }` for parse_cv/parse_job/match/generate/verify so `generate` (90 s) is not cut off. The plugin's per-stage sampling waits are 35–80 s (see `_SAMPLING_TIMEOUTS`) so a structured error surfaces before the host kills the invoke.
- **Demo mode:** if the host SDK cannot connect, `state.demo` is set and the pipeline returns `sample.js` data; the header shows a `Preview` badge and an info banner; the tracker seeds the four sample applications. No host required to review the UI.
- **Fixtures in repo:** `app/fixtures/sampling-pipeline.jsonl` (combined per-stage fixture for manual harness checks) plus `cv.txt` / `job.txt`. Note: the CLI `--mock-llm` resolves the **first** fixture entry, so it cannot serve different stages from one file; use `anna-app executa dev --mock-sampling <fixture>` for per-stage checks.
- **Bundle entry:** `app/bundle/index.html`. Do not add `<meta name="viewport">`; the mobile shell injects it and reviewers grep for it. Without the host shell the local layout viewport is 980 px, so use the mobile shell (or a temporary viewport meta) for mobile review.
- **Testing:** plugin tests (`uv run --extra dev pytest`) cover taxonomy, parsing, matching, scoring, honesty, lint, and the plugin. Bundle smoke loops use headless Chromium against `http://localhost:5180/anna-apps/app/dev/index.html`; the desktop dashboard is at `http://localhost:5180/`.
- **Fallback:** if sampling returns `-32001`/`-32008`/`-32009`, the Executa returns `{code:"SAMPLE_REQUIRED", params:{...}}`; the bundle calls `anna.llm.complete` directly (declared in `ui.host_api.llm`) and re-invokes the same tool with `precomputed_response`; the executa then runs the identical parsing/validation path, so fabrication checks are unchanged. Implemented; no setup screen.

## Hard constraints

- Sampling: `maxTokens` ≤ 8,192 per call; ≤ 8 calls per invoke; ≤ 32,000 total tokens per invoke; token TTL 600 s. Thinking is off by default.
- `tools.invoke` sync timeout 90 s; longer work needs `tools.invokeAsync` (up to 24 h). Keep each of the five invokes under 90 s or switch to async.
- `describe`/`initialize` timeout 5 s; `invoke` default 60 s, overridable per tool via `tools[].timeout`.
- Tool `parameters` are a **list** of `{name,type,description,required,default,enum,items}`, not a JSON Schema object (current CLI template).
- Plugin must keep reading stdin until EOF; never exit after one response.
- Reverse-RPC sampling must echo `params.context.invoke_id` in `metadata.executa_invoke_id` for budget attribution.
- `llm.sample` is default-on for users since beta.135 (staff answer in forum 238). The older sampling doc still says a user toggle is required; treat `-32001` as a fallback trigger, not a setup failure.
- APS storage (`storage/*` from the Executa) is opt-in per user. Iframe `storage.*` in the default app scope is not.
- CSP: base `font-src 'self' data:`, `style-src 'self' 'unsafe-inline'`, `script-src 'self'`; Google Fonts cannot load. Bundle fonts locally or use system stacks.
- Mobile: declare `form_factors: ["desktop","mobile"]`; ≥320 px, safe-area insets, 44 px targets, no hover-only actions, no viewport override, no geometry dependence.
- Bundle limits: 50 MB, 2,000 files, 10 MB per file. Static assets should stay under 200 KB for this app.
- Manifest: schema 3 rejects top-level `permissions`; use `ui.host_api` + `storage` instead. `required_executas` can be empty for bundle-only apps, but we bundle one.
- Bundled Executa publish: `app.json#bundled_executas` maps handle → path; `anna-app apps publish` publishes each Executa and substitutes the minted `tool_id` into `bundled:<handle>` references. The UI reads the substituted ID from `bundle/anna-tool-ids.js` (do not hardcode).
- Cloud Agent needs a deployed Executa binary. A local-only distribution profile is not enough; the ntfy app was rejected because its bundled tool was not deployed on the Cloud Agent.
- `anna-app dev` needs a PAT for live LLM. Use `--no-llm` or `--mock-llm` offline; use `anna-app login --host https://anna.partners` for live.

## Local commands

```bash
export PATH="$HOME/.local/bin:$PATH"
cd app
anna-app validate --strict
anna-app executa dev --dir executas/hirekit --describe
anna-app executa dev --dir executas/hirekit --invoke ping --json
cd executas/hirekit && uv run --extra dev pytest -q
cd ../..
anna-app dev --no-llm          # dashboard http://localhost:5180/
anna-app dev --mock-llm fixtures/sampling-pipeline.jsonl   # LLM mock (note: first entry wins)
```
The bundle is at `http://localhost:5180/anna-apps/app/dev/index.html`. The dev server resolves `bundled:hirekit -> tool-dev-hirekit`; `--no-llm` breaks sampling, so the five stages fail with a structured error and the UI shows the retry banner.

## Executa binary

The linux-x86_64 artifact is at `app/executas/hirekit/artifacts/hirekit-0.1.0-linux-x86_64.tar.gz`
(14 MB, sha256 `77ca7040e2fb233c3ad1d3bc0f1ef16f9354360115446b39884b12da1dfb3cd8`), entrypoint `bin/hirekit-tool`. `executa.json` declares a `binary` distribution profile under `distribution.profiles`; `local` remains active.

Rebuild:

```bash
cd app/executas/hirekit
uv run --with pyinstaller python -m PyInstaller --onefile --name hirekit-tool \
  --add-data "$PWD/hirekit/taxonomy:hirekit/taxonomy" \
  --add-data "$PWD/hirekit/prompts:hirekit/prompts" \
  --distpath artifacts/bin --workpath artifacts/build --specpath artifacts hirekit_plugin.py
```

Archive with `hirekit-0.1.0/manifest.json` + `bin/hirekit-tool` at the root. Verify with `describe` and `invoke ping`. Publishing requires the server-minted `tool_id` and `anna-app login`; use `anna-app executa publish --profile binary --dry-run` to validate before uploading to a Cloud Agent.

## Key links

- Docs index: https://anna.partners/llms.txt
- App manifest: https://anna.partners/developers/apps/app-manifest
- UI manifest: https://anna.partners/developers/apps/app-ui-manifest
- Host API: https://anna.partners/developers/reference/ui-host-api
- Storage: https://anna.partners/developers/reference/host-api-storage
- Sampling: https://anna.partners/developers/tools/executa-sampling
- Lifecycle: https://anna.partners/developers/tools/executa-lifecycle
- Protocol: https://anna.partners/developers/tools/executa-protocol
- Binary distribution: https://anna.partners/developers/tools/executa-binary
- Mobile: https://anna.partners/developers/apps/app-mobile
- Publish: https://anna.partners/developers/apps/app-publish
- Testing bundle: https://anna.partners/developers/apps/testing-bundle
- Testing plugin: https://anna.partners/developers/apps/testing-plugin
- Default sampling grant: https://forum.anna.partners/t/aps-sampling-capability-strings-default-grants-and-local-harness-support-runtime-0-2-0a21/238
- MAU for bundle-only apps: https://forum.anna.partners/t/founding-builder-buidl-deadline-while-app-review-is-pending-and-mau-counting-for-bundle-only-apps/351
- Review rejection example: https://forum.anna.partners/t/ntfy-app-id-279-review-feedback-received-rejected-resubmission-plan-timeline-question-dorahacks-deadline-sep-30/316
