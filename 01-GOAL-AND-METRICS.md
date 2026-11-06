# 01 Goal and Metrics: HireKit

## One-line promise
Paste a job and your CV; get an honest, evidence-backed application kit in under 60 seconds.

## Problem
Tech applicants send generic CVs, list stacks they barely know, and get filtered by keyword screens or caught out in interviews. Generic AI rewriters make it worse: they invent skills and metrics. Recruiters and hiring managers check GitHub links and probe every technology on the CV. People also lose track of where they applied.

## Audience
Primary: people applying for technical roles: software engineers (frontend, backend, full-stack, mobile), data and ML, DevOps and SRE, QA automation, security. Core segments: CS and bootcamp students and graduates (internships, junior roles, graduate programmes), self-taught developers, career switchers into tech, and mid-level engineers changing jobs.
Positioning: tech-first, with a general engine underneath. Templates, vocabulary, examples and interview prep are tuned for tech roles. Non-tech roles still work but are not marketed.
Regions: global. Region conventions are secondary (see 04b).

## Declared primary function (used for Qualified App Run)
"Generate application kit": given a job description and a CV, return a fit report plus a complete kit. One kit generated successfully = one qualified run.

## Differentiators (what makes it stand out in review and in use)
1. Evidence Bank and no-fabrication guarantee: every generated line cites CV evidence; unsupported claims are removed and turned into questions for the user.
2. Coverage Report: job requirements are tests (Pass, Partial, Fail) and the headline number is requirement coverage, like test coverage, shown as a block bar next to a requirement-by-requirement matrix.
3. Tech evidence: GitHub projects, open-source work, coursework, hackathons and internships all count as evidence; stack names are normalized (Postgres equals PostgreSQL) so keyword matching is accurate.
4. Gap plan: for each missing requirement, a concrete next step (small project, course, how to phrase honestly).
5. Application tracker: saved kits with status, deadline and notes, which brings users back every week.
6. Resume lint and claim risk: ATS-safe formatting checks, and a list of every claimed technology with the interview question you should expect for it.

## Success metrics
| Metric | Target |
|---|---|
| Qualified App MAU by 2026-11-30 | 300 (hard floor 200) |
| New-user first-run success (kit returned) | 97% or higher |
| p95 kit generation time | under 45 s |
| Users with 2 or more kits in a month | 35% or more |
| First-time App Review pass | yes |
| Fabrication rate in golden tests | 0 unsupported claims |

## Benefit to Anna (the host)
Repeat runs and credit consumption per user; clear showcase of host LLM, web fetch, storage and tools APIs; a polished flagship in the "Productivity" category that works for first-time users with zero setup; shareable outcomes that bring new signed-in users to Anna.

## Non-goals (v1)
Auto-applying to jobs, job board scraping, CV design templates/PDF layout engine, video interviews, accounts outside Anna, payments.

## Risks and mitigations
| Risk | Mitigation |
|---|---|
| Crowded category, "clone" rejection | Evidence Bank, Coverage Report, resume diff, claim risk, tracker are clearly distinct; state them in listing |
| Hallucinated claims | Structured evidence IDs, verifier pass, golden tests |
| Review delay or rejection | Submit by 11-09, pre-review judge gate, known rejection causes (V9) |
| Job URLs blocked | Paste is primary, URL is a convenience with graceful fallback |
| LLM latency or limits | Staged pipeline, progress UI, async job if needed (V5) |
| Not enough MAU | 07-GROWTH.md plan, student communities, real users only |
