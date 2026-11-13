# STATUS: HireKit
Last updated: 2026-11-06 UTC

## Gate
Current: Phase 1 backend core implemented, bundle UI verified, Anna Dev app published (v0.1.0 rejected, v0.1.1 pending resubmission). G1 already passed; focus is review acceptance.

## Done
- Inbox and plan files read; Anna platform research done (forum threads 205, 228, 238, 316, 351, 372; docs for apps/manifest/storage/sampling/mobile/binary).
- Executa protocol v2 plugin with five tools (`parse_cv`, `parse_job`, `match`, `generate`, `verify`) plus `ping`; sampling metadata echo; structured errors; `llm.complete` fallback implemented.
- Taxonomy 510 entries; scoring, lint, honesty enforcement; 24 pytest tests pass; `anna-app validate --strict` passes.
- Bundle UI implemented (S1–S7) with storage, theme, responsive 320–2560px; no console errors; 44px touch targets; preview fallback.
- Linux x86_64 binary built and archived (`hirekit-0.1.1-linux-x86_64.tar.gz`) with root-level `manifest.json` + `bin/hirekit-tool`; works.
- App published to Anna (app_id=833) as `@vincentofweb3/hirekit`; reviewer rejected v0.1.0 for missing Linux binary and incomplete listing.
- v0.1.1 changes: binary distribution `active`, root-level archive, listing logo/screenshots/description uploaded via `anna-app apps sync-meta`.
- GitHub repo public: https://github.com/vincentofweb3/hirekit

## In progress
- Clean up STATUS/process notes for accuracy before further review.
- Re-cut and re-submit v0.1.1 for review (requires Cloud Agent test first).

## Blockers
- Need a real Cloud Agent test before re-submitting (fresh install, full flow).
- Reviewer cannot be forced; acceptance is Anna's decision.
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
