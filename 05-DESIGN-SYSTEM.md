# 05 Design System: HireKit (tech-first)

Companions: `05b-SCREENS-AND-FLOWS.md` (every screen, flow and state), `tokens.css` (real tokens, use as is), `assets/` (logo and icon SVG), `mockup/index.html` (clickable prototype; edit all sample copy in the one `window.SAMPLE` object at the top of that file).

## 1. Intent
HireKit should feel like a tool a developer already trusts: a code review for your career. Dense but calm, keyboard friendly, honest about uncertainty. The core metaphors, used consistently:
- **Requirements are tests.** Each job requirement is a test with Pass, Partial or Fail. The headline number is **coverage** (like test coverage), not a vague "match score".
- **Rewrites are diffs.** Original line in red, tailored line in green, each with evidence chips. Nothing appears without a source.
- **Your CV is a repo.** Evidence has IDs (`proj_1`, `exp_1`), like commits you can point to.
- **Resume lint.** ATS and formatting problems are shown as lint results.

Principles: (1) Evidence over polish. (2) Show the work, never invent. (3) Fast first run, zero setup. (4) Keyboard and copy friendly. (5) Respect the user's time: one primary action per screen.

## 2. Audience and tone
Developers, data and DevOps people, bootcamp and CS students, career switchers into tech. Voice: direct, precise, a little dry, never hype. Say "Fail" not "Opportunity". Say what to do next. No exclamation marks, no emoji, no "AI magic" language.

## 3. Brand
- Name: HireKit. Mark: rounded square outline in ember orange with a checklist and a check (`assets/icon.svg`). Wordmark: Inter Bold (`assets/logo.svg`).
- Clear space: half the icon width. Minimum icon size 20 px. Never recolor the check; on light surfaces use the light-theme accent.
- Listing icon: `assets/icon.svg` exported 512 px; background `--hk-bg`.

## 4. Color (see tokens.css for exact values, dark and light)
| Role | Token | Dark | Light | Rule |
|---|---|---|---|---|
| Page | --hk-bg | #0B0F14 | #F6F8FA | page background only |
| Panels | --hk-s1 / s2 / s3 | #121820 / #1A222D / #222C3A | #FFF / #EEF2F6 / #E3E9F0 | s1 cards, s2 inputs and hovers, s3 inactive fills |
| Lines | --hk-border | #263140 | #D0D7DE | 1 px everywhere |
| Text | --hk-text / muted / faint | #E6EDF3 / #8B98A9 / #5F6C7D | #1F2328 / #59636E / #818B98 | faint only for non-essential hints |
| Accent | --hk-accent | #FF7A1A | #C2410C | primary buttons, coverage fill, brand mark. Text on accent uses --hk-accent-fg |
| Pass | --hk-pass | #3FB950 | #1A7F37 | Pass, added diff lines |
| Partial | --hk-partial | #D29922 | #9A6700 | Partial, needs-input |
| Fail | --hk-fail | #F85149 | #CF222E | Fail, removed diff lines, destructive |
| Focus/info | --hk-focus | #58A6FF | #0969DA | focus ring, links |
Rules: accent is for the one primary action per view and the coverage fill. Status colors always come with a text label and a glyph (check, half, cross), never color alone. All text pairs meet WCAG AA (4.5:1) in both themes; verify with a contrast checker in Phase 2.

## 5. Typography
- UI: Inter (fallback system-ui). Mono: JetBrains Mono (fallback ui-monospace). Fonts only if verification item V4 allows loading; otherwise rely on the fallback stacks, and the design must still hold.
- Scale: 12 (xs, chips, kbd), 13 (sm, secondary), 15 (base, body), 18 (lg), 22 (xl, section), 30 (2xl, page title), 44 (coverage number, weight 700).
- Mono is for evidence IDs, requirement tests output, diffs, keywords, and code. Prose and headings stay in Inter. Do not set labels in mono just for effect.
- Line height 1.55 body, 1.2 headings. Max line length 70ch for documents (cover letter, outreach).
- Sentence case everywhere. No ALL CAPS.

## 6. Layout and spacing
Spacing scale 4, 8, 12, 16, 24, 32, 48. Content max width 1080 px, 16 px gutters (24 px at 1024+). Breakpoints: 360 (min), 640, 820 (two columns begin), 1080. Two column grids collapse to one under 820. Sticky top bar 56 px. Vertical rhythm: sections 24 px apart, cards 16 px padding.

## 7. Surface, radius, elevation
Borders do most of the work. Radius: 4 (chips), 8 (inputs, buttons, diffs), 12 (cards, documents). Shadow only for raised overlays (dialog, toast) and the document panel in print preview. No gradients, no glass.

## 8. Icons and glyphs
Prefer inline SVG at 16 px, 1.5 px stroke, `currentColor`. Status glyphs: check, half circle, cross. Do not use emoji. Do not use arrows inside button labels. Always pair an icon with text unless it is a tooltip-labelled icon button.

## 9. Motion
Durations 120 ms (hover, press) and 200 ms (panel changes), easing cubic-bezier(.2,0,0,1). Signature moment: the coverage blocks fill left to right on report load (400 ms total). Pulsing dot on the running progress stage. Everything respects `prefers-reduced-motion` (no animation, instant states).

## 10. Component catalog (name, anatomy, states, notes)
| Component | Anatomy | States | Notes |
|---|---|---|---|
| Button | label, optional kbd hint | default, hover, focus, active, disabled, loading | Primary (accent), Secondary (s2 + border), Danger (fail outline). One primary per view. Loading shows spinner and keeps width |
| Text area | label, counter, helper | default, focus, error, disabled, filled | Mono 13 px, resizable, shows word counter and limit. Paste detection trims weird whitespace |
| Select | label, value | default, focus, disabled | Native element styled to tokens |
| Tabs | tab buttons | selected, hover, focus | Left aligned, underline-free, selected uses s2 fill. Arrow keys switch, role=tablist |
| Status badge | glyph + label | pass, partial, fail | Pill, tinted background token, text label always |
| Evidence chip | mono ID | default, hover (tooltip shows the CV excerpt), missing (dashed, "no evidence yet") | Click opens the evidence side panel |
| Coverage bar | 20 blocks, number, caption | loading (empty), filled | Role img with aria-label "78 percent coverage". Blocks filled = round(score/5) |
| Requirement row | badge, text, chips, note | pass, partial, fail | Fail rows end with "Add evidence" action; partial rows show the missing piece |
| Diff block | removed line, added line, chips | default, copied | Mono 13 px; `-` and `+` gutter glyphs; each added line has at least one chip; Copy button per block |
| Needs-input card | question, relates-to, answer field, Update kit button | open, answered, skipped | Dashed partial border. Answering regenerates only affected sections |
| Document panel | rendered text, Copy, Export | default | Sans, 70ch, no shadow except print |
| Lint list | status glyph + message | pass, partial, fail | Click scrolls to the offending line |
| Progress stages | dot, label | pending, running, done, failed | Failed stage shows reason and Retry. Cancel always visible |
| Kanban card | role, company, fit chip, date | default, dragging, focus | Keyboard move with arrow keys plus Enter; menu button for non-drag users |
| Toast | message | info, error | Bottom center, 4 s, never blocks, has Undo for deletes |
| Dialog | title, body, actions | open | Used only for Delete everything. Focus trapped, Esc closes |
| Empty state | one sentence, one action | n/a | Plain text, no illustration |
| Error banner | cause, fix, action | n/a | Inline above the affected content, role=alert |
| Kbd hint | key caps | n/a | Only on desktop widths |

## 11. Data visualization rules
Coverage uses a single hue (accent) with empty blocks in s3. Do not use gradients or 3D. Numbers always shown next to bars. Keyword chips: found = solid border text pass color, missing = dashed muted.

## 12. Keyboard map
Ctrl or Cmd + Enter: Build my kit. G then R, K, T: go to Report, Kit, Tracker. 1 to 5: switch kit tabs. C: copy the focused section. / : focus the job box. ? : shortcut sheet. Every shortcut has a visible alternative.

## 13. Theming and host integration
Default dark, follow `prefers-color-scheme`, and a Theme toggle. If Anna's UI SDK exposes a theme signal or CSS variables (read the docs: app-ui-sdk, app-ui-host-api, app-ui-bundle), map it onto `--hk-*` tokens; never hardcode colors in components. Do not override the shell-injected viewport meta (review-enforced); respect safe-area insets.

## 14. Accessibility
AA contrast both themes; focus ring 2 px `--hk-focus`, never removed; semantic landmarks (header, nav, main); every control has an accessible name; status never color-only; tab order follows visual order; reduced motion; touch targets 44 px on mobile; screen reader announcements via aria-live for progress stages and for Copied.

## 15. Responsive behaviour
Under 820: single column, inputs stacked (Job above CV), sticky bottom bar holds the primary action. Requirement rows stack badge above text. Kanban becomes a status filter list. Diff blocks scroll horizontally inside their container; body never scrolls sideways.

## 16. Content design
Sentence case, plain verbs, concrete next step in every error. Microcopy library (use verbatim):
- Build my kit | Copy letter | Update kit | Add evidence | Export all as Markdown | Delete everything | Save to tracker
- Empty tracker: "No applications yet. Build a kit and save it here."
- Short job text: "That job post is too short to read. Paste the full description."
- Unsupported claim: "We removed a line that your CV does not support. Answer one question to add it back."
- Delete dialog: "Delete your saved CV, kits and tracker from this app? This cannot be undone."
- Privacy: "Your CV and kits stay in your Anna account. Delete them anytime."
- Never: "Supercharge", "land your dream job", "AI-powered", exclamation marks.

## 17. Implementation rules
Use `tokens.css` verbatim; components read tokens only. One CSS file per component or CSS modules, no utility framework required. Class prefix `hk-`. Mono and sans via the two font variables. No inline colors. Static assets under 200 KB total.

## 18. Design QA checklist (agent self-check at G3)
Both themes pass AA; keyboard-only run of the full flow; 360 px and 1280 px screenshots of every screen; every state in 05b exists (no dead buttons, no "coming soon"); prototype parity (layout, hierarchy, copy); no color-only status; reduced motion honored; no horizontal body scroll; screenshots for the listing taken from the real UI.
