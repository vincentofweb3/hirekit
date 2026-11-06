# 02 Plan: HireKit

Dates are 2026. Today is Wed 11-04. Each task has an ID and acceptance criteria (AC). Do not skip gates.

## Phase 0: Setup and verification (Wed 11-04 to Thu 11-05, Gate 1 Fri 11-06 morning)
- HK-001 Create Anna account, activate Developer Console access (self-serve: verify email, accept Developer ToS). AC: console access confirmed.
- HK-002 Install `anna-app` CLI, scaffold a project, run `anna-app dev`. AC: harness loads locally. Mirror anna-app-focus-flow structure.
- HK-003 Read the docs list (shared rules section 7). AC: 10-line summary of architecture in STATUS.md.
- HK-004 Resolve V1 to V10. AC: each answered with a doc/forum link; any contradiction escalated.
- HK-005 Hello-world Executa tool called from the bundle through the host (tools.*). AC: round trip works locally; with `--llm` and PAT if V5 requires.
- HK-006 Draft the manifest (schema 2+), validate with the CLI. AC: validation passes.
GATE 1: report.

## Phase 1: Backend pipeline (Thu 11-05 to Sat 11-07, Gate 2 Sat evening)
- HK-010 JSON schemas for CvEvidenceBank, JobRequirements, MatchResult, Kit (see 04-PRODUCT-SPEC.md). AC: pydantic (or equivalent) models with validation.
- HK-011 Stage 1 parse_cv to Evidence Bank with stable IDs. AC: 10 sample CVs parse; no invented items.
- HK-012 Stage 2 parse_job to requirements (must-have, nice-to-have, keywords). AC: 10 sample JDs parse; prompt-injection text in JD is ignored.
- HK-013 Stage 3 match and Fit Score (formula in spec). AC: deterministic scoring from statuses; reproducible.
- HK-014 Stage 4 generate kit (bullets, letter, outreach, interview prep, gap plan) constrained to evidence IDs. AC: every bullet and claim carries evidence_ids.
- HK-015 Stage 5 verifier pass removes or flags unsupported claims and emits "needs your input" questions. AC: golden fabrication tests at 0 failures.
- HK-016 Orchestrating tool `build_kit` with progress events/status, timeouts, one retry, partial results. AC: p95 under 45 s on test set (or async pattern per V5).
- HK-017 Optional: job URL fetch via web.* with fallback message. AC: failure shows paste fallback.
GATE 2: demo run in terminal or harness with real LLM output; golden test results.

## Phase 2: UI (Fri 11-06 to Sun 11-08, Gate 3 Sun evening)
- HK-020 App shell, tokens, typography, dark mode per 05-DESIGN-SYSTEM.md and 05b-SCREENS-AND-FLOWS.md.
- HK-021 Input screen: job paste/URL, CV paste, profile save, mode and region selects, one primary button.
- HK-022 Progress screen with stage names and a cancel action.
- HK-023 Fit Report: Coverage Report, requirement matrix with evidence chips.
- HK-024 Kit tabs: Bullets, Cover letter, Outreach, Interview prep, Gap plan; copy buttons; export to .txt/.md; print stylesheet.
- HK-025 Needs-your-input panel: user answers questions, regenerate affected parts only.
- HK-026 Tracker: save kit, status columns, deadline, notes, delete. Persist via storage (V6).
- HK-027 Profile and privacy: saved CV, delete-all button, plain-language privacy note.
- HK-028 All states: empty, loading, error, rate/limit, offline, partial result.
- HK-029 Mobile layout and keyboard/focus accessibility.
- HK-030 Unit tests (vitest mountBundle) and plugin tests (anna-executa-test).
- HK-031 Implement tokens.css, component library per 05 section 10, both themes. AC: every component has all listed states.
- HK-032 Stack taxonomy and alias resolver (04b) with unit tests. AC: 300 or more entries; tests pass.
- HK-033 Resume lint rules and claim-risk list. AC: lint results appear in the report.
GATE 3: self-scored 06 checklist, screenshots, short screen recording.

## Phase 3: Submit (Mon 11-09, hard stop Tue 11-10)
- HK-040 Listing fields per Listing docs using 07-GROWTH.md copy; icon; 4 to 6 screenshots.
- HK-041 Upload bundle version, test in Anna (not local only), fix issues.
- HK-042 Orchestrator judge review (GATE 4). Then submit for App Review.

## Phase 4: Review window (11-10 to approx 11-16)
- HK-050 Prepare growth assets (07-GROWTH.md) while waiting.
- HK-051 Handle review feedback within 24 hours; resubmit the same day when possible.
- HK-052 Private beta with real students (their own accounts, genuine use). Collect issues; fix in v1.0.1.

## Phase 5: Launch and maintain (approval to 11-30)
- HK-060 Publish, test the shareable link, begin launch plan.
- HK-061 Daily: check errors, usage, feedback. Fix P0 same day.
- HK-062 v1.1 by 11-22: one real feature (recommended: interview mock Q&A with feedback on typed answers).
- HK-063 Write a maintenance note per release.
