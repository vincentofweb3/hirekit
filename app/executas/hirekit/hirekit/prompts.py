"""Prompt loading and rendering."""

from __future__ import annotations

import json
from pathlib import Path
from string import Template

_PROMPT_DIR = Path(__file__).resolve().parent / "prompts"


def _load(name: str) -> Template:
    return Template((_PROMPT_DIR / f"{name}.txt").read_text(encoding="utf-8"))


def _json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2)


def parse_cv(cv_text: str) -> str:
    return _load("parse_cv").substitute(cv_text=cv_text.strip())


def parse_job(job_text: str) -> str:
    return _load("parse_job").substitute(job_text=job_text.strip())


def match(job: dict, evidence: dict) -> str:
    return _load("match").substitute(
        job_json=_json(job),
        evidence_json=_json(evidence),
    )


def generate(
    job: dict,
    matches: dict,
    evidence: dict,
    answers: list[dict] | None,
    *,
    tone: str,
    level: str,
    role_track: str,
) -> str:
    return _load("generate").substitute(
        job_json=_json(job),
        match_json=_json(matches),
        evidence_json=_json(evidence),
        answers_json=_json(answers or []),
        tone=tone,
        level=level,
        role_track=role_track,
    )


def verify(evidence: dict, kit: dict) -> str:
    return _load("verify").substitute(
        evidence_json=_json(evidence),
        kit_json=_json(kit),
    )
