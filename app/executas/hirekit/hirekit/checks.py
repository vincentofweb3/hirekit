"""Deterministic honesty checks shared by lint and verify."""

from __future__ import annotations

import re

from .models import EvidenceBank, JobRequirements

_TITLE_RE = re.compile(
    r"\b(?:senior|staff|principal|manager|director|head of|vice president|vp|chief|"
    r"team lead|tech lead|lead)\b",
    re.IGNORECASE,
)


def allowed_titles(
    evidence: EvidenceBank,
    job: JobRequirements | None = None,
    *,
    allow_job_title: bool = False,
) -> set[str]:
    titles = {item.title.lower() for item in evidence.items if item.title}
    if allow_job_title and job is not None:
        if job.title:
            titles.add(job.title.lower())
        if job.company:
            titles.add(job.company.lower())
    return titles


def title_claims(text: str) -> set[str]:
    return {match.group(0).lower() for match in _TITLE_RE.finditer(text)}


def unsupported_title(
    text: str,
    evidence: EvidenceBank,
    job: JobRequirements | None = None,
    *,
    allow_job_title: bool = False,
) -> str:
    allowed = allowed_titles(evidence, job, allow_job_title=allow_job_title)
    for claim in title_claims(text):
        if any(claim in title for title in allowed):
            continue
        return claim
    return ""
