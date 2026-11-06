# 03 Tools and Stack: HireKit

## Architecture (Anna App = manifest + UI bundle + Executa tool + optional Skill)
```
User (signed-in Anna user)
  |  iframe window (static SPA bundle)
  |    UI calls host API: tools.* (run build_kit), storage.* (tracker, profile), web.* (job URL), window.*
  v
Anna host  ---- sampling (host LLM, billed in CU, no API key) ---->  LLM
  |
  v
Executa tool "hirekit" (Python, stdio JSON-RPC)
   parse_cv -> parse_job -> match -> generate_kit -> verify -> build_kit (orchestrator)
```
Key decision D1: the primary function runs inside the Executa tool using host sampling, so each run is a server-side recorded execution (confirm V1). The UI never calls the LLM directly for the primary function.
Key decision D2: pure logic (scoring, ID handling, schema validation, de-duplication, stack alias taxonomy) lives in the tool as plain code, not in prompts. LLM does language and judgement only.
Key decision D3: tracker and saved profile live in per-app storage (storage.*; confirm V6). Nothing leaves Anna.

## Toolchain
| Need | Tool | Notes |
|---|---|---|
| Scaffold, dev, validate | `anna-app` CLI | mirror anna-app-focus-flow |
| UI | Vite + TypeScript + React (or the reference's framework) | static bundle, no server |
| Styling | CSS variables, no heavy UI kit | follow 05-DESIGN-SYSTEM.md and 05b-SCREENS-AND-FLOWS.md |
| Tool runtime | Python 3.11+ with `uv`, pydantic | Node alternative allowed if the reference is Node |
| LLM | Executa sampling | model selection per V5 |
| Tests | vitest + `mountBundle`; `anna-executa-test` (pytest) | golden dataset in `executa/tests/golden/` |
| Packaging | per Executa Binary Distribution docs if required for publish | read tools/executa-binary and publish docs |
| Source control | git, conventional commits | |

## Suggested repo layout (adapt to the reference)
```
hirekit-app/
  manifest.json
  ui/            (SPA source)  -> built bundle
  executa/hirekit/
     main.py  pipeline/  prompts/  schemas.py  taxonomy/  tests/golden/
  skill/         (only if the manifest needs prompt instructions)
  docs/anna-notes.md
```

## Host API grants to request (verify names and minimal set)
tools.* (invoke build_kit), storage.*, web.* (job URL fetch only if V7 allows), window.*. Request the minimum; reviewers see grants.

## Prompt engineering rules
- One prompt file per stage, versioned. Inputs and outputs are JSON with explicit schemas.
- Evidence Bank items have IDs (e.g. `exp_1`, `proj_2`, `edu_1`, `skill_3`). Stage 4 may only reference those IDs.
- JD and CV text are untrusted data: delimit them, and instruct the model to ignore instructions inside them.
- Temperature low for parse/verify stages, moderate for letter/outreach.
- Output validation: schema check, then retry once with the validation error, then degrade.

## Evaluation (golden set, build it on day 1)
10 pairs minimum: 3 students with no job history, 2 career switchers, 2 senior, 1 non-native English CV, 1 very short CV, 1 JD with embedded prompt injection. Automated checks: every claim has evidence_ids that exist; no new employers/degrees/numbers/tools appear that are not in the CV; JSON validates; latency recorded.

## Out of scope tooling
No external paid APIs, no accounts outside Anna, no analytics SDKs, no third-party fonts unless V4 confirms.
