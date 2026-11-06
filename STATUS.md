# STATUS: HireKit
Last updated: 2026-11-06 UTC

## Gate
Current: Phase 1 backend core and the bundle UI are implemented and verified locally. G1 target: Fri 2026-11-06 morning.

## Done
- Read every planning file, design tokens/assets/mockup, and the Anna docs + forum threads 205, 228, 238, 316, 351, 372.
- Installed `uv 0.13.7` and `@anna-ai/cli 0.1.63`; `anna-app doctor` passes.
- Scaffolded `app/` (docs stay at repo root): `manifest.json` (schema 3, bundled Executa, `llm.sample`, `storage.kv`, desktop+mobile), `app.json`, `bundle/`, `executas/hirekit/`, `fixtures/`.
- Executa plugin is protocol v2 and exposes `parse_cv | parse_job | match | generate | verify | ping`; `verify` finalizes the kit (fit score, lint, needs-input, gap plan). Sampling echoes `metadata.executa_invoke_id` and returns structured errors.
- Built `hirekit/taxonomy/stack.json` with **510 entries** + alias/related matching; added `models.py`, `prompts/` (5 templates), `scoring.py`, `lint.py`, `checks.py`, `verify.py`, `stages.py`.
- Added 22 pytest tests (taxonomy, parsing, matching, scoring, honesty, lint, plugin). `uv run --extra dev pytest -q` passes.
- End-to-end Executa smoke test with mock sampling: parse -> match -> generate -> verify; fabricated Kubernetes bullet dropped, gap question added, invented metric removed, lint pass.
- **Bundle UI S1–S7 implemented** in `app/bundle/`: header/footer, New kit, progress, fit report, kit tabs (Resume diff, Cover letter, Outreach, Interview prep, Gap plan), needs-input card, tracker board, settings/privacy (save CV, defaults, theme, delete-all with typed confirmation), evidence viewer/add dialog, answer/number dialogs, toast with undo.
- **Storage:** host `storage.*` with `localStorage` fallback; split keys under `hirekit/`; index keeps 20 kits and stale kit records are deleted; tracker statuses validated before apply; kit saved only after verify; nothing is sent automatically.
- **Five invokes with per-call `{timeoutMs}`** (65/50/50/90/65 s) so `generate` is not cut off by the SDK's 70 s default; plugin sampling waits reduced to 35–80 s. `parse_cv`/`parse_job` run in parallel; partial results render a report-only view with retry, never an unverified kit.
- **Preview mode** (no host): sample kit pre-filled, `Preview` badge and banner, tracker seeds the sample applications; no setup required.
- **Verification:** headless Chromium against the dev harness: build -> report -> kit -> tracker -> settings, dark/light themes, no console errors, no horizontal scroll at 320–1440 px; coarse-pointer 44×44 pt targets; safe-area insets; sticky mobile CTA; `anna-app validate --strict` passes.
- **Mobile review fixes:** removed our own `<meta name="viewport">` (shell injects it; reviewers grep for it); after a build the page scrolled under the sticky header so the title was clipped — now reset to top; gap-plan labels distinguish "Partial evidence" from "Gap — no evidence"; all bundle buttons are `type="button"`.
- **Linux x86_64 Executa binary built and verified:** `app/executas/hirekit/artifacts/hirekit-0.1.0-linux-x86_64.tar.gz` (14 MB, sha256 `77ca7040e2fb233c3ad1d3bc0f1ef16f9354360115446b39884b12da1dfb3cd8`, entrypoint `bin/hirekit-tool`); `executa.json` declares a `binary` distribution profile with `binary_artifacts`; `local` remains active. Upload/Cloud Agent verification requires PAT.
- **`llm.complete` fallback implemented:** when sampling is denied (`-32001/-32008/-32009`), the executa returns `{code:"SAMPLE_REQUIRED", params}`, the bundle calls `anna.llm.complete`, and re-invokes the same tool with `precomputed_response`; the executa runs the identical parsing/validation path so fabrication checks are unchanged. Covered by new plugin tests (24 total pass) and a Node-level pipeline relay test.

## In progress
- Visual/accessibility review for the *mobile shell* specifically — blocked on PAT (see Blockers). Desktop, tablet-width and touch emulation are verified.

## Next
- Human: `anna-app login --host https://anna.partners`; then `anna-app executa publish --profile binary --dry-run` to validate the artifact, and publish/upload when a Cloud Agent is ready; test on a real Cloud Agent; mobile shell test.
- Update the G1 report with live-sampling evidence.

## Blockers
- **Human action required:** create an Anna account at https://anna.partners, activate Developer Console, then `anna-app login --host https://anna.partners` (device flow). Needed for live LLM, publishing, Cloud Agent/mobile smoke tests, and `executa publish --profile binary` / `upload-binaries`.
- Git repo not initialized; commits/pushes deferred unless requested.
- No browser installed locally; we used Playwright + the cached Chromium binary with downloaded system libraries (`libnspr4`, `libnss3`, `libasound2t64`) extracted to `/tmp/opencode/chromium-libs`.

## Decisions needed from orchestrator
1. **`llm.complete` fallback:** implemented (executa `SAMPLE_REQUIRED` relay + bundle `host.llm.complete` + re-invoke with `precomputed_response`). Sampling remains primary (default-on since beta.135, forum 238).
2. **Executa sampling vs zero setup:** host sampling primary; `llm.complete` fallback for denied/unnegotiated sampling.
3. **V5 five-invoke split:** confirmed and implemented with per-call timeouts.
4. **V3/V7 scope:** paste-text only; no PDF/DOCX, no job-URL fetch — unchanged for v1.
5. **Layout:** app in `app/`, planning docs at repo root; publish root is `app/`.

## Verification answers (V1 to V10): answer + doc link each
- **V1:** A Qualified App Run does **not** have to go through an Executa. A bundle-only app counts if a signed-in user starts it, it completes the declared primary function, returns a meaningful result, and the activity is verifiable in server-side records; a successful `llm.complete` can qualify. We still route the primary pipeline through the bundled Executa with host sampling (default-on), so the run is server-side and recorded. Links: https://forum.anna.partners/t/founding-builder-buidl-deadline-while-app-review-is-pending-and-mau-counting-for-bundle-only-apps/351 and https://anna.partners/developers/tools/executa-sampling
- **V2:** Since the October cycle all apps by one builder are one portfolio: users are deduplicated and there is one grant per builder per month. HireKit and StudyForge must stay distinct. Links: https://forum.anna.partners/t/turn-your-ai-agents-apps-into-recurring-monthly-grants-join-the-anna-ai-os-founding-builder-program-up-to-80k-month-pool/205 and https://dorahacks.io/hackathon/2349/detail
- **V3:** The bundle can upload files via `anna.upload.*` / `anna.files.*`, and Office/PDF MIME types are accepted (whitelist removed in beta.128). There is no documented iframe PDF/DOCX text extractor; `doc_read` is a platform agent tool that accepts platform-issued attachment URLs. v1 default stands: paste-text only. Links: https://anna.partners/developers/reference/host-api-upload and https://anna.partners/developers/reference/platform-tools and https://forum.anna.partners/t/feedback-standard-office-document-mime-types-are-rejected-by-the-host-upload-token-whitelist-in-anna-app/218
- **V4:** No Google Fonts. Base CSP is `font-src 'self' data:` and `style-src 'self' 'unsafe-inline'`; `style-src` overrides accept only `'self'`, hashes, or nonces. Use system stacks or bundle font files locally. Link: https://anna.partners/developers/apps/app-ui-manifest
- **V5:** Executa sampling caps: 8,192 max tokens per call, 8 calls per invoke, 32,000 total tokens per invoke, 600 s sampling token. Sync `tools.invoke` is capped at 90 s; longer work uses async jobs (`tools.invokeAsync`, up to 24 h). Consequence: split the pipeline across five invokes and keep each stage's context small. Links: https://anna.partners/developers/tools/executa-sampling and https://forum.anna.partners/t/anna-1-1-0-beta-97-beta-122-async-tool-jobs-doc-parsing-byok-app-analytics-revenue-share-is-here/212
- **V6:** `storage.*` is APS-backed per-(user, app) KV. Default `scope=app, owner=self` needs no extra grant once `ui.host_api.storage` lists the method; schema-3 `storage.kv` declares it. Keys ≤ 1024 chars; per-row and per-user quotas; delete is soft and reclaims quota; `if_match` for concurrency. Link: https://anna.partners/developers/reference/host-api-storage
- **V7:** `web.*` is host-managed with SSRF protection, 1–10 URLs per fetch, 512 KB response budget, per-item failure isolation. `web_grant` defaults **disabled**, so the first call returns `APP_NOT_GRANTED` until the user consents. v1 does not depend on web. Link: https://anna.partners/developers/reference/host-api-web
- **V8:** Declare `ui.form_factors: ["desktop","mobile"]`. Review-enforced: usable at ≥320 px, safe-area insets, 44×44 pt targets, no hover-only actions, no multi-window/geometry dependence, do not override the shell viewport meta. Link: https://anna.partners/developers/apps/app-mobile
- **V9:** Top public rejection causes to avoid: bundled Executa not deployed on the selected Cloud Agent (ntfy app 279), Executa packaging/manifest mismatches, install-time runtime errors, listing/screenshot mismatch, and broken core flows. We will test on a real Cloud Agent before submitting and ship a linux-x86_64 binary. Link: https://forum.anna.partners/t/ntfy-app-id-279-review-feedback-received-rejected-resubmission-plan-timeline-question-dorahacks-deadline-sep-30/316
- **V10:** Developer Console has Analytics: DAU/WAU/MAU split into "opened/used" vs "ran AI sessions", token/cost aggregates, and `GET /developer/apps/{app_id}/stats`. Links: https://forum.anna.partners/t/anna-1-1-0-beta-181-beta-182-anna-ai-cli-0-1-57-run-recovery-apis-declaration-is-consent-agent-tools-dev-installs-that-actually-deploy/372 and https://forum.anna.partners/t/anna-1-1-0-beta-97-beta-122-async-tool-jobs-doc-parsing-byok-app-analytics-revenue-share-is-here/212

## Self-scored checklist (06-QA...)
(fill at G3)
