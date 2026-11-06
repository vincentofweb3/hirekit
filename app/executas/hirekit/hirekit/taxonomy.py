"""Stack normalization and alias matching for HireKit."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Iterable

_DATA_PATH = Path(__file__).resolve().parent / "taxonomy" / "stack.json"

_PRUNED_ALIASES = {
    "py", "pd", "tf", "es", "do", "bq", "cv", "mq", "sh", "kt", "rn", "tf",
    "asp", "gql", "k8", "ml", "ai", "ui", "ux", "qa", "ci", "cd", "db",
}
_TWO_LETTER_OK = {"js", "ts", "s3", "r", "c"}
_SPECIAL_CASE_SENSITIVE = {"r", "c"}


def normalize(value: str) -> str:
    value = value.lower().replace("&", " and ")
    value = value.replace(".", " ").replace("/", " ").replace("-", " ")
    value = re.sub(r"[^a-z0-9+# ]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def _load() -> tuple[dict[str, dict], dict[str, str], dict[str, list[str]]]:
    data = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    entries: dict[str, dict] = {}
    alias_to_canonical: dict[str, str] = {}
    canonical_aliases: dict[str, list[str]] = {}
    for entry in data["entries"]:
        canonical = entry["canonical"]
        entries[canonical] = entry
        aliases = [canonical, *entry.get("aliases", [])]
        cleaned: list[str] = []
        for alias in aliases:
            key = normalize(alias)
            if not key:
                continue
            if key in _PRUNED_ALIASES and key not in {"js", "ts"}:
                continue
            if len(key) == 2 and key not in _TWO_LETTER_OK:
                continue
            if len(key) == 1 and key not in _TWO_LETTER_OK:
                continue
            cleaned.append(key)
            alias_to_canonical.setdefault(key, canonical)
        canonical_aliases[canonical] = sorted(set(cleaned))
    return entries, alias_to_canonical, canonical_aliases


ENTRIES, ALIAS_TO_CANONICAL, CANONICAL_ALIASES = _load()


def canonical(name: str) -> str:
    key = normalize(name)
    return ALIAS_TO_CANONICAL.get(key, name.strip())


def aliases_for(name: str) -> list[str]:
    return CANONICAL_ALIASES.get(canonical(name), [normalize(name)])


def related(name: str) -> list[str]:
    entry = ENTRIES.get(canonical(name))
    return list(entry.get("related", [])) if entry else []


def _alias_pattern(alias: str) -> re.Pattern[str]:
    escaped = re.escape(alias).replace(r"\ ", r"\s+")
    return re.compile(rf"(?<![a-z0-9+#]){escaped}(?![a-z0-9+#])")


_PATTERNS = {
    alias: _alias_pattern(alias)
    for aliases in CANONICAL_ALIASES.values()
    for alias in aliases
}


def find_technologies(text: str) -> set[str]:
    """Return canonical technology names mentioned in ``text``."""
    normalized = normalize(text)
    found: set[str] = set()
    for alias, pattern in _PATTERNS.items():
        if alias in _SPECIAL_CASE_SENSITIVE:
            if not re.search(rf"(?<![A-Za-z]){alias.upper()}(?![A-Za-z])", text):
                continue
        if pattern.search(normalized):
            found.add(ALIAS_TO_CANONICAL[alias])
    return found


def text_mentions(text: str, name: str) -> bool:
    return canonical(name) in find_technologies(text)


def _as_dict(item) -> dict:
    if isinstance(item, dict):
        return item
    if hasattr(item, "model_dump"):
        return item.model_dump()
    return dict(item)


def evidence_text(item) -> str:
    item = _as_dict(item)
    parts = [
        item.get("title", ""),
        item.get("org", ""),
        item.get("dates", ""),
        " ".join(item.get("facts", []) or []),
        " ".join(item.get("skills", []) or []),
        " ".join(item.get("stack", []) or []),
        " ".join(str(m.get("text", "")) for m in item.get("metrics", []) or []),
        item.get("source_quote", ""),
    ]
    return "\n".join(str(part) for part in parts if part)


def keyword_coverage(
    keywords: Iterable[str], evidence_items: Iterable[dict]
) -> dict[str, list[str]]:
    evidence_blob = "\n".join(evidence_text(item) for item in evidence_items)
    found: list[str] = []
    missing: list[str] = []
    for keyword in keywords:
        if not keyword:
            continue
        tech = canonical(keyword)
        if tech in find_technologies(evidence_blob):
            if tech not in found:
                found.append(tech)
        elif keyword not in missing:
            missing.append(keyword)
    return {"found": found, "missing": missing}


def _body_text(item) -> str:
    item = _as_dict(item)
    parts = [
        item.get("title", ""),
        item.get("org", ""),
        " ".join(item.get("facts", []) or []),
        " ".join(item.get("stack", []) or []),
        item.get("source_quote", ""),
        " ".join(str(m.get("text", "")) for m in item.get("metrics", []) or []),
    ]
    return "\n".join(str(part) for part in parts if part)


def claim_risks(evidence_items: Iterable[dict]) -> list[dict]:
    """Flag skills not demonstrated by a role or project body."""
    items = [_as_dict(item) for item in evidence_items]
    body_items = [
        item
        for item in items
        if item.get("type") in {"experience", "project", "leadership", "volunteering"}
    ]
    all_body_tech = find_technologies("\n".join(_body_text(item) for item in body_items))
    risks: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for item in items:
        if item.get("type") == "skill":
            candidates = item.get("skills", []) or [item.get("title", "")]
            body_tech = all_body_tech
        elif item.get("type") in {"experience", "project", "leadership", "volunteering"}:
            candidates = item.get("skills", []) or []
            body_tech = find_technologies(_body_text(item))
        else:
            continue
        for skill in candidates:
            tech = canonical(skill)
            if not tech or not find_technologies(tech):
                continue
            if tech in body_tech:
                continue
            related_overlap = sorted(set(related(tech)) & body_tech)
            key = (tech, str(item.get("id", "")))
            if key in seen:
                continue
            seen.add(key)
            risks.append(
                {
                    "technology": tech,
                    "evidence_ids": [item.get("id", "")],
                    "risk": "medium" if related_overlap else "high",
                    "rationale": (
                        f"Related evidence exists ({', '.join(related_overlap)}), "
                        "but the exact technology is not shown."
                        if related_overlap
                        else "Listed in skills but not shown in a role or project."
                    ),
                }
            )
    return risks
