#!/usr/bin/env bash
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tool_dir="$here/executas/hirekit"

version="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$here/executas/hirekit/executa.json")"

cd "$tool_dir"
rm -rf artifacts/bin artifacts/build artifacts/staging
uv run --with pyinstaller python -m PyInstaller --onefile --name hirekit-tool \
  --add-data "$tool_dir/hirekit/taxonomy:hirekit/taxonomy" \
  --add-data "$tool_dir/hirekit/prompts:hirekit/prompts" \
  --distpath artifacts/bin --workpath artifacts/build --specpath artifacts hirekit_plugin.py

archive="artifacts/hirekit-${version}-linux-x86_64.tar.gz"
mkdir -p "artifacts/staging/hirekit-${version}/bin"
cp artifacts/bin/hirekit-tool "artifacts/staging/hirekit-${version}/bin/hirekit-tool"
chmod 755 "artifacts/staging/hirekit-${version}/bin/hirekit-tool"
cat > "artifacts/staging/hirekit-${version}/manifest.json" <<JSON
{
  "name": "hirekit",
  "version": "$version",
  "runtime": {
    "binary": {
      "entrypoint": {
        "default": "bin/hirekit-tool"
      },
      "permissions": {
        "bin/hirekit-tool": "0o755"
      }
    }
  }
}
JSON
tar -czf "$archive" -C artifacts/staging "hirekit-${version}"
rm -rf artifacts/staging
sha256sum "$archive"

printf '%s\n' "Built $archive"
