# HireKit app

Paste a job and your CV; get a fit report, tailored CV bullets, a cover letter,
outreach, interview prep and a gap plan — every generated line traced to a
quote from the CV. If evidence is missing, HireKit asks instead of inventing
it.

## Layout

- `bundle/` — the Anna App UI (static SPA, sandboxed iframe)
- `executas/hirekit/` — Python stdio JSON-RPC plugin, protocol v2
  (`parse_cv`, `parse_job`, `match`, `generate`, `verify`, `ping`)
- `fixtures/` — mock sampling responses for the dev harness
- `manifest.json` — schema 3; bundles `bundled:hirekit`, declares `llm.sample`
  and `storage.kv`, `form_factors: ["desktop", "mobile"]`
- `app.json` — listing metadata + `bundled_executas`

## Local development

```bash
cd app
anna-app validate --strict   # static + host_api ACL checks
anna-app dev --no-llm        # dashboard http://localhost:5180/
```

The app itself is at `http://localhost:5180/anna-apps/app/dev/index.html`.

Without a host the bundle runs in **preview mode** with the sample Ada Eze /
Northwind Payments kit. In the dashboard the bundled Executa is resolved as
`tool-dev-hirekit`; sampling fails with the `--no-llm` backend, so the pipeline
surfaces a structured error and the UI shows a retry banner.

If sampling is denied, the executa returns `SAMPLE_REQUIRED`, the bundle asks
the host to run the same prompt via `llm.complete`, and the executa revalidates
the result with the same deterministic honesty checks.

With an account: `anna-app login --host https://anna.partners`, then
`anna-app dev` uses live sampling. The Executa calls the host LLM, never an
API key from the user.

## Plugin tests

```bash
cd executas/hirekit
uv run --extra dev pytest -q
```

Covers taxonomy, parsing, matching, scoring, honesty checks and the plugin.

## Executa binary

```bash
./scripts/build_executa_binary.sh
```

Builds the linux-x86_64 `hirekit-tool` and archives it at
`executas/hirekit/artifacts/hirekit-<version>-linux-x86_64.tar.gz`. Upload and
Cloud Agent verification require `anna-app login` and
`anna-app executa publish --profile binary --dry-run`.

## Mock sampling

`fixtures/sampling-pipeline.jsonl` contains one canned response per stage.
Note that `anna-app dev --mock-llm` always picks the **first** matching
entry, so it cannot serve different stages from one file; use
`anna-app executa dev --mock-sampling fixtures/sampling-pipeline.jsonl`
for per-stage checks.

## Mobile

The bundle must not set its own `<meta name="viewport">`; the mobile shell
injects it and reviewers grep for it. Locally, width < 980 px without the
shell renders with a 980 px layout viewport, so check mobile through the shell
or with a temporary viewport meta.
