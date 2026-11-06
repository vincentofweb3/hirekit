# Agent Instructions: HireKit

## Role
You are the execution agent. The orchestrator (Claude, via the human owner) wrote the plan and will judge your work. You build, test and prepare submission. You do not change scope, name, primary function or design direction without approval; propose changes in STATUS.md under "Decisions needed".

## Before writing any code
1. Read `../_shared/PROGRAM-RULES.md` fully, then every numbered file in this folder.
2. Read the Anna docs listed in section 7 of the shared rules. Study the anna-app-focus-flow reference and mirror its project structure.
3. Do Phase 0 in 02-PLAN.md: scaffold, run locally, resolve V1 to V10, fill STATUS.md, stop at Gate 1.

## Rules
- Design is fixed: implement 05-DESIGN-SYSTEM.md and 05b-SCREENS-AND-FLOWS.md using tokens.css and assets/ verbatim. 04b-TECH-FIRST-ADDENDUM.md supersedes any conflicting text in files 01 to 07.
- No placeholder UI: no dead buttons, no coming-soon items, no lorem ipsum.
- Primary function (declared): "Generate application kit". It must run server-side through an Executa tool (confirm via V1).
- No fabrication: the product's core promise. Treat any path that can emit an unsupported claim as a P0 bug.
- Paste-text first. Add file upload only if V3 proves it easy and it does not threaten the date.
- Never invent API names; verify in docs. Quote doc links in STATUS.md.
- Keep a `/docs` note in the repo for anything non-obvious you learned about Anna.
- Commit small and often. Conventional commit messages.

## Reporting format (STATUS.md)
Update at every gate and whenever blocked: done / in progress / next / blockers / decisions needed / verification answers / self-scored checklist. Keep it factual: links, screenshots, command outputs.

## Escalate immediately if
- A verification item contradicts the plan (for example, tool-run not counted for MAU).
- Anna's host LLM limits break the pipeline design.
- You are more than half a day behind the plan.
