# 05b Screens and Flows: HireKit

Visual reference: `mockup/index.html`. Build every screen listed. P0 = required for submission, P1 = v1.1.

## Information architecture
Top bar: logo, New kit, Report, Kit, Tracker, Theme toggle, Settings (privacy). Report and Kit show only after a kit exists (otherwise disabled with a tooltip "Build a kit first").

## Flows
F1 First run: open app, see New kit with sample job placeholder, paste job + CV, Build my kit, progress (about 30 s), Report, Kit, Save to tracker. Zero setup, no sign-in screens inside the app.
F2 Returning user: saved CV chip prefilled, paste only the job, Build, Report. Tracker shows previous kits.
F3 Needs-input loop: Kit shows Needs your input, user answers one question, Update kit regenerates affected lines only, diff updates, lint rerun.
F4 Failure and recovery: stage fails or times out, banner states what happened, Retry keeps inputs, partial results stay visible, nothing is lost.
F5 Delete: Settings, Delete everything, dialog, confirmation toast, app returns to empty New kit.

## S1 New kit (P0)
```
Desktop (>=820)
+-- Top bar ----------------------------------------------------------+
| [logo]  New kit  Report  Kit  Tracker                       [Theme]  |
+----------------------------------------------------------------------+
| New kit                                                              |
| Paste a job and your CV. Every line links back to evidence.          |
| +-- Job description ------------+  +-- Your CV  [saved profile] ---+  |
| | (mono textarea, counter)      |  | (mono textarea, counter)      |  |
| +-------------------------------+  +-------------------------------+  |
| Role track [Backend v]  Level [Junior v]  Tone [Direct v]            |
| [Build my kit]  Ctrl+Enter     Job URL (P1): [ paste link ]          |
+----------------------------------------------------------------------+
Mobile: stacked; sticky bottom bar with [Build my kit].
```
Components: text areas, selects, primary button, saved-profile chip, kbd hint. Validation: job at least 80 words, CV at least 80 words, over 4,000 and 6,000 words show counter in warning color with "Trim to continue". States: empty (placeholders show an example job and an example CV line), filled, validating, error (inline per field), building (button loading, redirect to S2).
Acceptance: a first-time user can build a kit without any setup or settings; CV chip appears after first successful run; limits enforced.

## S2 Progress (P0)
```
Building your kit                     Junior Backend Engineer, Northwind
+----------------------------------------------------------------------+
| (done) Reading your CV                                                |
| (done) Reading the job                                                |
| (run)  Matching requirements                                          |
| ( )    Writing your kit                                               |
| ( )    Checking every claim against your CV                           |
+----------------------------------------------------------------------+
[Cancel]
```
States: running, stage failed (reason + Retry), timeout (keeps partial), cancelled (confirm, no data saved). Announce stage changes with aria-live. Acceptance: no indefinite spinner; cancel works at any stage; partial results retained on failure.

## S3 Report (P0)
```
Junior Backend Engineer    Northwind Payments  | Backend | Junior
+----------------------------------------------------------------------+
| 78%  requirement coverage     [Save to tracker]                      |
| [##############______]   Good fit. Query tuning and queues are gaps.  |
+----------------------------------------------------------------------+
Requirement tests
 Pass     Build REST APIs in Node.js or Python        proj_1 exp_1
 Partial  PostgreSQL schema design and query tuning   proj_1
          Schema design shown. No evidence of tuning.   [Add evidence]
 Pass     Docker and CI/CD                            proj_1
 Pass     Unit and integration tests                  proj_1
 Fail     Message queues (nice to have)               no evidence yet
 Partial  Cloud (AWS or GCP) (nice to have)           proj_1
Keywords: found (solid)   missing (dashed)       Resume lint: 3 results
[View my kit]
```
Behavior: clicking an evidence chip opens a side panel with the CV excerpt (Mobile: bottom sheet). "Add evidence" opens a one-line input that creates a Needs-input answer and jumps to S4. Score formula and bands per 04-PRODUCT-SPEC.md. Bands: 80+ Strong fit, 60 to 79 Good fit, 40 to 59 Stretch, under 40 Long shot, each with an actionable sentence.
Acceptance: every requirement has a status and either evidence chips or "no evidence yet"; coverage animation honors reduced motion; numbers match the deterministic formula.

## S4 Kit (P0)
Tabs: Resume diff, Cover letter, Outreach, Interview prep, Gap plan.
- Resume diff: per bullet a diff block (original red, tailored green), evidence chips, Copy per block, inline "Add a real number" prompts for bullets missing metrics, Needs your input section below.
- Cover letter: document panel (70ch), Copy letter, Export all as Markdown. Tone control (P1: regenerate section).
- Outreach: short message (under 600 characters) for a recruiter or engineer, Copy.
- Interview prep: 6 to 8 question cards: question, why asked, answer outline bullets, evidence chips. Every technology the CV claims gets at least one likely question ("you listed it, expect it").
- Gap plan: card per gap: honest phrasing line (mono), next step, effort chip (hours, days, weeks).
Needs your input card: question, relates-to, answer box, Update kit. After Update, only affected diffs and report rows change and show a brief highlight.
Acceptance: no generated line without evidence chips; unsupported lines never shown; Copy works with confirmation "Copied"; Export produces clean Markdown.

## S5 Tracker (P0)
Columns Saved, Applied, Interview, Closed. Card: role, company, fit chip, date or deadline, notes icon, Open kit. Add manual item (P1). Move via drag or keyboard or menu. Empty state text per 05. Persisted via storage; Delete item with Undo toast. Mobile: status filter chips plus single list.

## S6 Settings and privacy (P0)
Saved CV (view, edit, replace), data summary (number of kits), Delete everything, privacy statement, keyboard shortcut sheet (?), theme preference. Dialog for deletion per microcopy.

## S7 Errors and edge screens (P0)
Banner components for: too short, too long, model timeout, partial result, storage failure ("Could not save. Your kit is still on screen. Copy it now."), offline. Full-page error only for load failure with Retry and "Report a problem" link to the Anna forum.

## S8 Listing screenshots (for submission)
Report (dark), Resume diff (dark), Needs your input, Tracker (light), Cover letter. 1280 by 800, taken from the real UI with the sample content.

## State matrix (every screen must implement)
| Screen | Empty | Loading | Success | Error | Partial |
|---|---|---|---|---|---|
| S1 | placeholders | validating | filled | field errors | n/a |
| S2 | n/a | stages | auto-advance | stage failed | partial kept |
| S3 | no kit yet | skeleton | full | load failure | some rows pending |
| S4 | no kit yet | per-tab skeleton | full | per-tab retry | tabs finished first |
| S5 | empty text | skeleton | list | save failure toast | n/a |
| S6 | no CV saved | n/a | saved | delete failure | n/a |

## Acceptance for design completeness
All screens S1 to S7 built; every state in the matrix implemented; both themes; 360 px and 1280 px screenshots of all screens attached to STATUS.md at G3; microcopy matches 05-DESIGN-SYSTEM section 16.
