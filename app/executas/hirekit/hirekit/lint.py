"""Deterministic resume and kit linting."""

from __future__ import annotations

import re
from datetime import date

from .checks import unsupported_title
from .models import EvidenceBank, JobRequirements, Kit, LintItem, MatchResult
from .taxonomy import claim_risks, find_technologies

_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_PHONE = re.compile(r"(?:\+?\d[\d\s().-]{6,}\d)")
_URL = re.compile(r"https?://[^\s<>()]+")
_BULLET = re.compile(r"^\s*(?:[-*•·]|\d+[.)])\s+(.+)$")
_DATE_RANGE = re.compile(
    r"(?P<start>(?:[A-Z][a-z]{2,8}\s+)?\d{4})\s*(?:-|–|—|to|until)\s*"
    r"(?P<end>(?:[A-Z][a-z]{2,8}\s+)?\d{4}|present|current|now)",
    re.IGNORECASE,
)
_MONTHS = {
    name: index
    for index, name in enumerate(
        [
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december",
        ],
        start=1,
    )
}

ACTION_VERBS = {
    "achieved", "adapted", "administered", "advised", "analyzed", "architected",
    "assembled", "audited", "authored", "automated", "benchmarked", "built",
    "cleaned", "coded", "collaborated", "communicated", "configured",
    "containerized", "contributed", "converted", "coordinated", "created",
    "debugged", "delivered", "deployed", "designed", "developed", "diagnosed",
    "documented", "drove", "engineered", "established", "evaluated", "expanded",
    "facilitated", "founded", "generated", "implemented", "improved",
    "increased", "initiated", "instrumented", "integrated", "launched", "led",
    "localized", "maintained", "managed", "measured", "mentored", "migrated",
    "modeled", "monitored", "optimized", "organized", "orchestrated",
    "owned", "partnered", "performed", "planned", "presented", "programmed",
    "prototyped", "published", "reduced", "refactored", "researched",
    "resolved", "reviewed", "scaled", "secured", "shipped", "simplified",
    "streamlined", "supported", "taught", "tested", "trained", "translated",
    "tuned", "validated", "visualized", "volunteered", "won", "wrote",
}


def _word_count(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def _bullet_lines(cv_text: str) -> list[str]:
    lines = [line.strip() for line in cv_text.splitlines() if line.strip()]
    bullets = []
    for line in lines:
        match = _BULLET.match(line)
        if match:
            bullets.append(match.group(1).strip())
    return bullets


def _parse_year_month(value: str) -> tuple[int, int]:
    cleaned = value.strip().lower()
    if cleaned in {"present", "current", "now"}:
        today = date.today()
        return today.year, today.month
    parts = cleaned.split()
    if len(parts) == 2 and parts[0] in _MONTHS:
        return int(parts[1]), _MONTHS[parts[0]]
    return int(parts[-1]), 1


def _check_dates(cv_text: str) -> list[LintItem]:
    items: list[LintItem] = []
    for match in _DATE_RANGE.finditer(cv_text):
        try:
            start = _parse_year_month(match.group("start"))
            end = _parse_year_month(match.group("end"))
        except (ValueError, KeyError):
            continue
        if end < start:
            items.append(
                LintItem(
                    status="fail",
                    message="A date range ends before it starts.",
                    line=match.group(0),
                )
            )
    return items


def lint_cv(
    cv_text: str,
    evidence: EvidenceBank,
    job: JobRequirements | None = None,
    *,
    level: str = "unknown",
) -> list[LintItem]:
    items: list[LintItem] = []
    words = _word_count(cv_text)
    if words < 40:
        items.append(LintItem(status="fail", message="The CV is very short; add a few concrete lines."))
    elif words > 6000:
        items.append(LintItem(status="fail", message="The CV is over the 6,000-word limit."))
    else:
        items.append(LintItem(status="pass", message=f"{words} words; within the 6,000-word limit."))

    if not _EMAIL.search(cv_text) and not _PHONE.search(cv_text):
        items.append(
            LintItem(
                status="partial",
                message="No email or phone found in the contact header.",
            )
        )
    else:
        items.append(LintItem(status="pass", message="Contact header found."))

    urls = _URL.findall(cv_text)
    malformed = [url for url in urls if " " in url or "." not in url.split("//", 1)[-1]]
    if malformed:
        for url in malformed[:3]:
            items.append(LintItem(status="fail", message="A link looks malformed.", line=url))
    if urls:
        items.append(LintItem(status="pass", message=f"{len(urls)} link(s) found."))
    else:
        items.append(
            LintItem(
                status="partial",
                message="No GitHub, LinkedIn, or portfolio link found.",
            )
        )

    table_lines = [line for line in cv_text.splitlines() if line.count("|") >= 2]
    if len(table_lines) > 2:
        items.append(
            LintItem(
                status="partial",
                message="Table-like lines may not extract cleanly; use single-column text.",
            )
        )

    sensitive = re.search(
        r"\b(?:date of birth|dob|marital status|religion|nationality|passport|ssn)\b",
        cv_text,
        re.IGNORECASE,
    )
    if sensitive:
        items.append(
            LintItem(
                status="partial",
                message=f"Remove sensitive personal data ({sensitive.group(0)}).",
            )
        )

    bullets = _bullet_lines(cv_text)
    weak = []
    no_number = []
    for line in bullets:
        first = re.split(r"\s+", line.strip(), maxsplit=1)[0].strip(".,:;").lower()
        if first and first not in ACTION_VERBS and not first[0].isdigit():
            weak.append(line)
        if not re.search(r"\d", line):
            no_number.append(line)
    if weak:
        items.append(
            LintItem(
                status="partial",
                message=f"{len(weak)} bullet(s) do not start with an action verb.",
                line=weak[0][:160],
            )
        )
    else:
        items.append(LintItem(status="pass", message="Bullets start with action verbs."))
    if no_number:
        items.append(
            LintItem(
                status="partial",
                message=(
                    f"{len(no_number)} bullet(s) have no number. Add one only where the CV "
                    "already supplies it; do not invent metrics."
                ),
                line=no_number[0][:160],
            )
        )

    items.extend(_check_dates(cv_text))

    if level in {"intern", "junior"} and words > 700:
        items.append(
            LintItem(
                status="partial",
                message="Intern and junior resumes usually fit on one page; tighten this draft.",
            )
        )

    for risk in claim_risks(evidence.items):
        items.append(
            LintItem(
                status="partial",
                message=(
                    f"Claim risk: {risk['technology']} is listed in skills but not shown "
                    "in a role or project."
                ),
            )
        )

    return items


def _numbers(text: str) -> set[str]:
    return set(re.findall(r"\d[\d,.]*(?:\s?%|\s?[kKmMxX+])?", text))


def _evidence_numbers(evidence: EvidenceBank) -> set[str]:
    values: set[str] = set()
    for item in evidence.items:
        values.update(_numbers(item.source_quote))
        values.update(_numbers(" ".join(item.facts)))
        for metric in item.metrics:
            values.update(_numbers(metric.text))
            values.update(_numbers(metric.value))
    return values


def _kit_paths(kit: Kit) -> list[tuple[str, str, list[str]]]:
    paths: list[tuple[str, str, list[str]]] = []
    for index, bullet in enumerate(kit.bullets):
        paths.append((f"bullets[{index}].text", bullet.text, bullet.evidence_ids))
    for index, paragraph in enumerate(kit.cover_letter.paragraphs):
        if paragraph.kind == "body":
            paths.append((f"cover_letter.paragraphs[{index}].text", paragraph.text, paragraph.evidence_ids))
    paths.append(("outreach.message", kit.outreach.message, kit.outreach.evidence_ids))
    for index, item in enumerate(kit.interview):
        paths.append(
            (
                f"interview[{index}].answer_outline",
                " ".join(item.answer_outline),
                item.evidence_ids,
            )
        )
    for index, item in enumerate(kit.gap_plan):
        paths.append(
            (
                f"gap_plan[{index}].honest_phrasing",
                item.honest_phrasing,
                [],
            )
        )
    return paths


def lint_kit(
    kit: Kit,
    evidence: EvidenceBank,
    job: JobRequirements,
    matches: MatchResult,
) -> list[LintItem]:
    items: list[LintItem] = []
    known_ids = set(evidence.by_id())
    evidence_numbers = _evidence_numbers(evidence)
    evidence_blob = " ".join(
        part
        for item in evidence.items
        for part in [item.source_quote, *item.facts, *item.skills, *item.stack]
    )
    evidence_tech = find_technologies(evidence_blob)

    for path, text, ids in _kit_paths(kit):
        if not text.strip():
            items.append(LintItem(status="fail", message="A generated section is empty.", line=path))
            continue
        missing = [eid for eid in ids if eid not in known_ids]
        if missing:
            items.append(
                LintItem(
                    status="fail",
                    message=f"Unknown evidence IDs: {', '.join(missing)}.",
                    line=path,
                )
            )
        if path.startswith(("bullets", "cover_letter", "outreach")) and not ids:
            items.append(
                LintItem(
                    status="fail",
                    message="A claim has no evidence IDs.",
                    line=path,
                )
            )
        invented = _numbers(text) - evidence_numbers
        if invented:
            items.append(
                LintItem(
                    status="fail",
                    message=f"Number not found in the evidence bank: {', '.join(sorted(invented))}.",
                    line=path,
                )
            )
        should_check_tech = path.startswith(
            ("bullets", "cover_letter", "outreach")
        ) or (path.startswith("interview") and bool(ids))
        if should_check_tech:
            mentioned = find_technologies(text)
            unknown = sorted(mentioned - evidence_tech)
            if unknown:
                items.append(
                    LintItem(
                        status="fail",
                        message=f"Technology not found in the evidence bank: {', '.join(unknown)}.",
                        line=path,
                    )
                )
        inflated_title = unsupported_title(
            text,
            evidence,
            job,
            allow_job_title=path.startswith(("cover_letter", "outreach")),
        )
        if inflated_title:
            items.append(
                LintItem(
                    status="fail",
                    message=f"Title not found in the evidence bank: {inflated_title}.",
                    line=path,
                )
            )
        if "!" in text:
            items.append(LintItem(status="partial", message="Remove the exclamation mark.", line=path))

    gaps = [
        req
        for req in job.requirements
        if not matches.by_requirement().get(req.id)
        or matches.by_requirement()[req.id].status == "gap"
    ]
    gap_plan_ids = {item.requirement_id for item in kit.gap_plan}
    missing_gaps = [req.text for req in gaps if req.id not in gap_plan_ids]
    if missing_gaps:
        items.append(
            LintItem(
                status="partial",
                message=f"{len(missing_gaps)} gap(s) have no plan item.",
                line=missing_gaps[0][:160],
            )
        )
    needs_input_ids = {item.relates_to for item in kit.needs_input}
    missing_questions = [req.text for req in gaps if req.id not in needs_input_ids]
    if missing_questions:
        items.append(
            LintItem(
                status="partial",
                message=f"{len(missing_questions)} gap(s) have no needs-input question.",
                line=missing_questions[0][:160],
            )
        )

    if not items:
        items.append(LintItem(status="pass", message="Kit passed deterministic lint."))
    return items
