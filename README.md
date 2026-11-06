# HireKit: Evidence-backed job application kits

Paste a job and your CV. Get an honest application kit in under a minute: fit report, tailored CV bullets, cover letter, outreach message, interview prep, and a tracker. Every line is traceable to something real in the user's CV.

Files, read in order:
- AGENT-INSTRUCTIONS.md: your role, rules, reporting
- 01-GOAL-AND-METRICS.md: why, for whom, how we win
- 02-PLAN.md: phases, dated tasks, acceptance criteria
- 03-TOOLS-AND-STACK.md: architecture, tools, decisions
- 04-PRODUCT-SPEC.md: screens, data model, pipeline, prompts rules
- 04b-TECH-FIRST-ADDENDUM.md: tech audience details (supersedes conflicting text)
- 05-DESIGN-SYSTEM.md: full design system. 05b-SCREENS-AND-FLOWS.md: every screen, flow and state
- tokens.css and assets/: real design tokens, logo and icon
- mockup/index.html: clickable prototype (edit sample copy in the one window.SAMPLE object)
- 06-QA-AND-REVIEW-CHECKLIST.md: tests and the judge scorecard
- 07-GROWTH.md: listing copy, launch plan, fair-play rules
- STATUS.md: you update this at every gate

## App

The runnable project is in `app/` — static SPA bundle, Python Executa plugin,
manifest, fixtures and the app README with local dev/test commands.
