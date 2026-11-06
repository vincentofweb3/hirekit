# 04b Tech-first addendum: HireKit (supersedes conflicting text in 01, 04, 07)

## Why
The audience is people applying for technical roles. Research on what technical recruiters and hiring managers look for (Cornell Career Services on entry-level software resumes, ATS checklists for software engineers, and developer community write-ups) agrees on four things: quantified impact, exact stack keywords that are actually true, working GitHub and project links, and projects explained as problem, decision and result. Candidates who list technologies they cannot explain get caught in interviews. HireKit's evidence-first design answers all four.

## Data model changes
```
EvidenceItem += { stack: [string], links: [{label,url}], metrics: [{text, value?}], repo?: {url, readme_excerpt?} }
Requirement  += { category: language|framework|database|infra|practice|domain|soft }
Claim        { technology, evidence_ids:[...], risk: low|medium|high }   // "claim risk": claimed in output or CV
```
Evidence sources accepted in v1: pasted CV text (required); pasted project README or description (P0 optional field "Add a project"); public GitHub repo URL read through web.* if V7 allows (P1).

## Stack normalization (code, not LLM)
Maintain `executa/hirekit/regions/..` replaced by `executa/hirekit/taxonomy/stack.json`: canonical names plus aliases (PostgreSQL = Postgres = psql; Kubernetes = k8s; JavaScript = JS; TypeScript = TS; Node.js = Node = NodeJS; CI/CD = GitHub Actions, GitLab CI, Jenkins as related not equal; AWS services by name). Matching rules: exact or alias = covered; related technology = partial with an honest rationale ("Jenkins is not GitHub Actions"). Start with at least 300 entries covering common languages, frameworks, databases, cloud, DevOps and testing tools. Unit-test the alias resolver.

## Role tracks
| Track | Keyword emphasis | Interview prep emphasis |
|---|---|---|
| Backend | APIs, databases, queues, testing, deployment | schema design, REST/idempotency, debugging a slow query |
| Frontend | frameworks, accessibility, performance, testing | state management, rendering performance, accessibility |
| Full-stack | both plus deployment | end-to-end feature walk-through |
| Mobile | platforms, release pipeline | lifecycle, offline, performance |
| Data and ML | SQL, pipelines, modelling, evaluation | metrics, data quality, experiment design |
| DevOps and SRE | CI/CD, IaC, observability, cloud | incident walk-through, reliability trade-offs |
| Security | threat modelling, tooling | vulnerability triage, secure design |
| QA | automation, test strategy | test pyramid, flaky tests |
Level (Intern, Junior, Mid, Senior) changes expected evidence depth and tone, not the honesty rules.

## Interview prep types (P0: behavioral and technical talking points from evidence; P1: system design prompts)
- Per claimed technology: one likely question plus an answer outline built only from evidence.
- Behavioral (STAR) outlines using projects and internships.
- System design (P1): one prompt relevant to the role, with an outline scaffold, clearly labelled practice, not evidence.
- Gap questions: honest answer scaffolds for the Fail rows.

## Resume lint rules (deterministic where possible)
Single column and text-extractable; no photo, tables for layout or text boxes in pasted structure (detect obvious patterns); contact header present; links present (GitHub, LinkedIn, portfolio) and not obviously malformed; bullet verbs present; bullets with no number flagged (never invent numbers); dates consistent; length by level (Intern/Junior one page); skills section does not list technologies absent from any project or role (claim risk).

## Honesty guarantees (unchanged, now explicit for tech)
Never invent metrics, repos, employers, titles, stacks or certifications. Never claim production experience from a tutorial project. "Used in a class project" stays "class project".

## Examples and sample content
Technical only: backend, frontend, data and DevOps roles. Sample content lives in one place (`mockup/index.html` window.SAMPLE and `executa/tests/golden/`); editing those updates every example.

## Listing and growth changes
See 07-GROWTH.md (rewritten). Channels shift to developer communities.
