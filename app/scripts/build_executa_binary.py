#!/usr/bin/env python3
"""
Build the HireKit Executa binaries for the current platform.

Produces:
- artifacts/hirekit-{version}-linux-x86_64.tar.gz
- artifacts/hirekit-{version}-darwin-arm64.tar.gz
- artifacts/hirekit-{version}-darwin-x86_64.tar.gz
- artifacts/hirekit-{version}-windows-x86_64.zip

Requires PyInstaller to be installed in the current environment.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOL_DIR = ROOT / "executas" / "hirekit"
ARTIFACTS = TOOL_DIR / "artifacts"

def platform_info() -> tuple[str, str]:
    try:
        import platform
        machine = platform.machine()
    except Exception:
        machine = ""
    system = sys.platform
    is_mingw = os.environ.get("MSYSTEM", "") != "" or "mingw" in system.lower() or "msys" in system.lower()

    # Arch aliases
    arch_aliases = {
        "amd64": "x86_64",
        "x64": "x86_64",
        "aarch64": "arm64",
        "armv7l": "armv7l",
        "i386": "x86",
        "i686": "x86",
    }
    arch = machine.lower()
    arch = arch_aliases.get(arch, arch)

    if sys.platform.startswith("linux"):
        return f"linux-{arch}", "tar.gz"
    if sys.platform == "darwin":
        return f"darwin-{arch}", "tar.gz"
    if sys.platform == "win32" or is_mingw:
        return f"windows-{arch}", "zip"
    raise RuntimeError(f"Unsupported platform: {sys.platform} {machine}")


def build_binary(*args: str) -> None:
    subprocess.run(["uv", "run", "--with", "pyinstaller", "python", "-m", "PyInstaller", *args], cwd=TOOL_DIR, check=True)


def main() -> None:
    version = json.loads((TOOL_DIR / "executa.json").read_text())["version"]
    platform, archive_format = platform_info()
    print(f"Building HireKit v{version} for {platform}")

    artifacts_path = ARTIFACTS
    artifacts_path.mkdir(parents=True, exist_ok=True)

    # Clean previous build outputs but keep downloaded artifacts
    for rel in ["bin", "build", "staging", f"hirekit-{platform}"]:
        p = artifacts_path / rel
        if p.exists():
            shutil.rmtree(p)

    # Build with PyInstaller
    add_data_sep = ":" if sys.platform != "win32" else ";"
    extra_args = []
    if platform.startswith("windows-"):
        extra_args.append("--onefile")
    else:
        extra_args.append("--onefile")

    build_binary(
        "--onefile",
        "--name", "hirekit-tool" if not platform.startswith("windows-") else "hirekit-tool",
        "--add-data", f"{TOOL_DIR / 'hirekit' / 'taxonomy'}{add_data_sep}hirekit/taxonomy",
        "--add-data", f"{TOOL_DIR / 'hirekit' / 'prompts'}{add_data_sep}hirekit/prompts",
        "--distpath", str(artifacts_path / "bin"),
        "--workpath", str(artifacts_path / "build"),
        "--specpath", str(artifacts_path),
        "hirekit_plugin.py",
    )

    # Stage archive layout: manifest.json at archive root, binary at bin/
    binary_name = "hirekit-tool" if not platform.startswith("windows-") else "hirekit-tool.exe"
    staged = artifacts_path / f"hirekit-{version}"
    bin_dir = staged / "bin"
    bin_dir.mkdir(parents=True, exist_ok=True)

    src_binary = artifacts_path / "bin" / binary_name
    if not src_binary.exists():
        raise RuntimeError(f"Missing built binary: {src_binary}")

    shutil.copy2(src_binary, bin_dir / binary_name)
    os.chmod(bin_dir / binary_name, 0o755)

    manifest = {
        "name": "hirekit",
        "version": version,
        "runtime": {
            "binary": {
                "entrypoint": {"default": f"bin/{binary_name}"},
                "permissions": {f"bin/{binary_name}": "0o755" if not platform.startswith("windows-") else "0o644"},
            }
        },
    }
    (staged / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    archive_base = artifacts_path / f"hirekit-{version}-{platform}"
    if archive_format == "zip":
        archive_name = shutil.make_archive(str(archive_base), "zip", root_dir=staged)
    else:
        archive_name = shutil.make_archive(str(archive_base), "gztar", root_dir=staged)

    shutil.rmtree(staged)

    # Repository-friendly: also keep default artifact for Linux direct upload
    print(f"Built {archive_name}", flush=True)


if __name__ == "__main__":
    main()
