"""Five-stage HireKit pipeline: parse, match, generate, verify."""

from __future__ import annotations

import json
import re
from typing import Any, Protocol

from pydantic import ValidationError

from . import prompts
from .models import (
    Bullet,
    CoverLetter,
    EvidenceBank,
    EvidenceItem,
    Fit,
    InterviewItem,
    JobRequirements,
    KitDraft,
    LetterParagraph,
    Link,
    Match,
    MatchResult,
    Metric,
    NeedsInput,
    Outreach,
    Requirement,
    VerifierResult,
)
from .scoring import compute_fit, detect_role_track
from .taxonomy import (
    canonical,
    claim_risks,
    evidence_text,
    find_technologies,
    keyword_coverage,
    related,
)
from .verify import finalize_kit

MAX_CV_WORDS = 6000
MAX_JOB_WORDS = 4000
_TECH_CATEGORIES = {"language", "framework", "database", "infra"}
_INJECTION_LINE = re.compile(
    r"\b(?:ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions|"
    r"disregard\s+(?:all\s+)?(?:previous|prior|above)|system\s+prompt|"
    r"you\s+are\s+now|pretend\s+(?:that\s+)?you|as\s+an\s+ai|"
    r"say\s+(?:that\s+)?the\s+candidate|claim\s+(?:that\s+)?the\s+candidate|"
    r"must\s+say|return\s+.*\byears?\s+of\s+experience)\b",
    re.IGNORECASE,
)


class StageError(Exception):
    def __init__(self, code: str, message: str, *, retryable: bool = True):
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable


class Sampler(Protocol):
    def sample(
        self,
        prompt: str,
        *,
        max_tokens: int,
        response_format: dict[str, Any] | None = None,
    ) -> dict[str, Any]: ...


def strip_injection(text: str) -> str:
    lines = []
    for line in text.splitlines():
        if _INJECTION_LINE.search(line):
            lines.append("[removed untrusted instruction]")
        else:
            lines.append(line)
    return "\n".join(lines)


def _words(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def _norm(text: str) -> str:
    return re.sub(r"[^a-z0-9+# ]+", " ", text.lower()).strip()


def _token_overlap(needle: str, haystack: str) -> float:
    tokens = [token for token in _norm(needle).split() if token]
    if not tokens:
        return 0.0
    haystack_tokens = set(_norm(haystack).split())
    return sum(1 for token in tokens if token in haystack_tokens) / len(tokens)


def _quote_supported(quote: str, cv_text: str) -> bool:
    normalized_quote = _norm(quote)
    normalized_cv = _norm(cv_text)
    if not normalized_quote:
        return False
    if normalized_quote in normalized_cv:
        return True
    if len(normalized_quote.split()) < 4:
        return False
    return _token_overlap(quote, cv_text) >= 0.85


def _numbers(text: str) -> set[str]:
    return set(re.findall(r"\d[\d,.]*", text))


def _coerce_evidence_data(data: Any) -> dict[str, Any]:
    if isinstance(data, list):
        return {"items": data}
    if not isinstance(data, dict):
        raise StageError("MALFORMED_MODEL_JSON", "The CV parser returned an invalid shape.")
    for key in ("evidence", "evidence_bank", "bank"):
        if isinstance(data.get(key), list):
            return {"items": data[key], "contact": data.get("contact", {})}
    return data


def _coerce_job_data(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise StageError("MALFORMED_MODEL_JSON", "The job parser returned an invalid shape.")
    for key in ("job", "requirements_result"):
        if isinstance(data.get(key), dict):
            return data[key]
    return data


def sanitize_evidence(bank: EvidenceBank, cv_text: str) -> EvidenceBank:
    cv_tech = find_technologies(cv_text)
    normalized_cv = _norm(cv_text)
    contact = bank.contact
    if contact.email and _norm(contact.email) not in normalized_cv:
        contact.email = ""
    if contact.phone and _norm(contact.phone) not in normalized_cv:
        contact.phone = ""
    contact.links = [
        link for link in contact.links if link.url and _norm(link.url) in normalized_cv
    ]

    items: list[EvidenceItem] = []
    seen: set[tuple[str, str, str, str]] = set()
    for raw in bank.items:
        quote = raw.source_quote.strip()
        if not quote or not _quote_supported(quote, cv_text):
            continue
        item = raw.model_copy(deep=True)
        item.source_quote = quote
        item.verified_quote = True
        item.title = item.title.strip()
        item.org = item.org.strip()
        item.dates = item.dates.strip()
        if not item.title:
            item.title = item.type.replace("_", " ").title()

        kept_facts: list[str] = []
        for fact in item.facts:
            fact = fact.strip()
            if not fact:
                continue
            fact_numbers = _numbers(fact)
            if fact_numbers and not fact_numbers <= _numbers(quote):
                continue
            if _token_overlap(fact, quote) < 0.5:
                continue
            kept_facts.append(fact)
        item.facts = kept_facts

        item.skills = [
            skill
            for skill in item.skills
            if not find_technologies(skill) or find_technologies(skill) <= cv_tech
        ]
        item.stack = [
            tech
            for tech in item.stack
            if not find_technologies(tech) or find_technologies(tech) <= cv_tech
        ]
        item.links = [
            link for link in item.links if link.url and _norm(link.url) in normalized_cv
        ]
        item.metrics = [
            metric
            for metric in item.metrics
            if metric.text and _numbers(metric.text) <= _numbers(quote)
        ]
        if not item.facts and not item.skills and not item.stack:
            continue

        key = (item.type, item.title, item.org, item.dates)
        if key in seen:
            continue
        seen.add(key)
        items.append(item)

    for index, item in enumerate(items, start=1):
        item.id = f"ev_{index}"
    bank.items = items
    return bank


def parse_cv(sampler: Sampler, cv_text: str) -> EvidenceBank:
    text = strip_injection(cv_text.strip())
    if _words(text) < 10:
        raise StageError("CV_TOO_SHORT", "Add at least a few lines about your experience.")
    if _words(text) > MAX_CV_WORDS:
        raise StageError("CV_TOO_LONG", f"Keep the CV under {MAX_CV_WORDS:,} words.")
    data = sample_json(sampler, prompts.parse_cv(text), max_tokens=4096)
    try:
        bank = EvidenceBank.model_validate(_coerce_evidence_data(data))
    except ValidationError as exc:
        raise StageError("INVALID_CV_SHAPE", "The CV parser returned an invalid structure.") from exc
    bank = sanitize_evidence(bank, text)
    if not bank.items:
        raise StageError(
            "CV_UNREADABLE",
            "We could not find concrete experience in the CV. Add projects, coursework, or roles.",
        )
    return bank


def _fallback_seniority(title: str) -> str:
    lowered = title.lower()
    if "intern" in lowered:
        return "intern"
    if "junior" in lowered or "graduate" in lowered or "entry" in lowered:
        return "junior"
    if "senior" in lowered or "staff" in lowered or "principal" in lowered:
        return "senior"
    if "mid" in lowered or "ii" in lowered:
        return "mid"
    return "unknown"


def parse_job(sampler: Sampler, job_text: str) -> JobRequirements:
    text = strip_injection(job_text.strip())
    if _words(text) < 10:
        raise StageError("JOB_TOO_SHORT", "Add the role, responsibilities, or requirements.")
    if _words(text) > MAX_JOB_WORDS:
        raise StageError("JOB_TOO_LONG", f"Keep the job description under {MAX_JOB_WORDS:,} words.")
    data = sample_json(sampler, prompts.parse_job(text), max_tokens=2048)
    try:
        job = JobRequirements.model_validate(_coerce_job_data(data))
    except ValidationError as exc:
        raise StageError("INVALID_JOB_SHAPE", "The job parser returned an invalid structure.") from exc

    seen: dict[str, Requirement] = {}
    for req in job.requirements:
        req.text = req.text.strip()
        if not req.text:
            continue
        req.keywords = [keyword.strip() for keyword in req.keywords if keyword.strip()]
        if not req.keywords:
            req.keywords = sorted(find_technologies(req.text))
        key = req.text.lower()
        if key in seen:
            existing = seen[key]
            existing.keywords = sorted(set(existing.keywords) | set(req.keywords))
        else:
            seen[key] = req
    job.requirements = []
    for index, req in enumerate(seen.values(), start=1):
        req.id = f"req_{index}"
        job.requirements.append(req)

    if not job.requirements:
        raise StageError(
            "JOB_TOO_VAGUE",
            "We could not find requirements. Add the responsibilities or qualifications section.",
        )
    if not job.keywords:
        job.keywords = sorted(find_technologies(text))
    else:
        job.keywords = list(dict.fromkeys(job.keywords))
    if job.seniority == "unknown":
        job.seniority = _fallback_seniority(job.title)
    return job


def _downgrade_match(
    req: Requirement, match: Match, evidence: EvidenceBank
) -> Match:
    known = evidence.by_id()
    match.evidence_ids = [eid for eid in match.evidence_ids if eid in known]
    if match.status in {"covered", "partial"} and not match.evidence_ids:
        match.status = "gap"
        match.rationale = "No evidence IDs supported this match."
        return match
    if req.category not in _TECH_CATEGORIES or not req.keywords:
        return match
    cited_text = "\n".join(evidence_text(known[eid]) for eid in match.evidence_ids)
    cited_tech = find_technologies(cited_text)
    exact = [keyword for keyword in req.keywords if canonical(keyword) in cited_tech]
    if match.status in {"covered", "partial"} and len(exact) < len(req.keywords):
        if exact and match.status == "covered":
            match.status = "partial"
            match.rationale = (
                match.rationale
                or f"Only part of the requirement is named in the evidence: {', '.join(exact)}."
            )
        elif not exact:
            related_tech = set()
            for keyword in req.keywords:
                related_tech.update(related(keyword))
            overlap = sorted(related_tech & cited_tech)
            if overlap:
                match.status = "partial"
                match.rationale = (
                    f"Related evidence ({', '.join(overlap)}) is not the same as "
                    f"{', '.join(req.keywords)}."
                )
            else:
                match.status = "gap"
                match.rationale = (
                    f"The cited evidence does not name {', '.join(req.keywords)}."
                )
    return match


def match_stage(
    sampler: Sampler, job: JobRequirements, evidence: EvidenceBank
) -> MatchResult:
    data = sample_json(
        sampler,
        prompts.match(job.model_dump(), evidence.model_dump()),
        max_tokens=3072,
    )
    try:
        result = MatchResult.model_validate(data)
    except ValidationError as exc:
        raise StageError("INVALID_MATCH_SHAPE", "The matcher returned an invalid structure.") from exc

    by_req = result.by_requirement()
    matches: list[Match] = []
    for req in job.requirements:
        match = by_req.get(req.id) or Match(
            requirement_id=req.id,
            status="gap",
            rationale="No match was returned for this requirement.",
        )
        match = _downgrade_match(req, match, evidence)
        if match.status == "gap":
            match.evidence_ids = []
        matches.append(match)
    result.matches = matches

    keywords = job.keywords or [kw for req in job.requirements for kw in req.keywords]
    result.keyword_coverage = keyword_coverage(keywords, evidence.items)
    result.claim_risks = claim_risks(evidence.items)
    result.fit = compute_fit(job, result, evidence)
    return result


def _first_cited(evidence: EvidenceBank, ids: list[str]) -> EvidenceItem | None:
    known = evidence.by_id()
    for eid in ids:
        if eid in known:
            return known[eid]
    return None


def _fallback_bullet(evidence: EvidenceBank) -> Bullet | None:
    for item in evidence.items:
        if item.type in {"experience", "project", "leadership", "volunteering"} and item.facts:
            fact = item.facts[0]
            return Bullet(
                text=fact,
                before=fact,
                evidence_ids=[item.id],
                needs_number=not bool(_numbers(fact)),
            )
    return None


def _fallback_interview(
    evidence: EvidenceBank, job: JobRequirements, matches: MatchResult
) -> list[InterviewItem]:
    items: list[InterviewItem] = []
    by_req = matches.by_requirement()
    evidence_tech = find_technologies(
        "\n".join(evidence_text(item) for item in evidence.items)
    )
    for tech in sorted(evidence_tech)[:4]:
        source = next(
            (
                item
                for item in evidence.items
                if tech in find_technologies(evidence_text(item))
            ),
            None,
        )
        if source is None:
            continue
        items.append(
            InterviewItem(
                question=f"How have you used {tech}?",
                why_asked=f"The posting or your CV mentions {tech}; interviewers will test depth.",
                answer_outline=source.facts[:3] or [source.source_quote],
                evidence_ids=[source.id],
            )
        )
    for req in job.requirements:
        match = by_req.get(req.id)
        if match and match.status == "gap":
            items.append(
                InterviewItem(
                    question=f"How would you approach {req.text} if you have not used it yet?",
                    why_asked="This is a gap in your evidence; answer honestly and show a plan.",
                    answer_outline=[
                        "Acknowledge the gap directly.",
                        "Describe a concrete learning or project plan.",
                        "Connect it to adjacent evidence where honest.",
                    ],
                    evidence_ids=[],
                )
            )
        if len(items) >= 7:
            break
    for item in evidence.items:
        if len(items) >= 7:
            break
        if item.type in {"experience", "project", "leadership"} and item.facts:
            items.append(
                InterviewItem(
                    question=f"Walk me through {item.title}.",
                    why_asked="Behavioral interviews test ownership and decisions.",
                    answer_outline=item.facts[:3],
                    evidence_ids=[item.id],
                )
            )
            break
    return items[:8]


def sanitize_kit(
    draft: KitDraft,
    job: JobRequirements,
    matches: MatchResult,
    evidence: EvidenceBank,
) -> KitDraft:
    draft.bullets = [bullet for bullet in draft.bullets if bullet.text.strip()]
    if not draft.bullets:
        fallback = _fallback_bullet(evidence)
        if fallback:
            draft.bullets = [fallback]
    for bullet in draft.bullets:
        bullet.text = bullet.text.strip()
        bullet.before = bullet.before.strip()
        if not bullet.before:
            source = _first_cited(evidence, bullet.evidence_ids)
            bullet.before = (
                (source.facts[0] if source and source.facts else source.source_quote)
                if source
                else bullet.text
            )
        source = _first_cited(evidence, bullet.evidence_ids)
        if source and not _numbers(bullet.text):
            bullet.needs_number = bool(source.metrics or _numbers(source.source_quote))

    if not draft.cover_letter.paragraphs:
        paragraphs = [LetterParagraph(text="Dear Hiring Manager,", kind="greeting")]
        if draft.bullets:
            top = draft.bullets[0]
            paragraphs.append(
                LetterParagraph(
                    text=top.text,
                    evidence_ids=top.evidence_ids,
                    kind="body",
                )
            )
        paragraphs.append(LetterParagraph(text="Sincerely,", kind="closing"))
        draft.cover_letter = CoverLetter(paragraphs=paragraphs)
    else:
        for index, paragraph in enumerate(draft.cover_letter.paragraphs):
            if index == 0:
                paragraph.kind = "greeting"
            elif index == len(draft.cover_letter.paragraphs) - 1:
                paragraph.kind = "closing"
            else:
                paragraph.kind = "body"

    if not draft.outreach.message.strip():
        top = draft.bullets[0] if draft.bullets else None
        title = job.title or "this role"
        company = job.company or "your team"
        message = f"Hello,\n\nI am applying for {title} at {company}."
        if top:
            message += f" {top.text}"
        message += "\n\nThank you for your time."
        draft.outreach = Outreach(
            subject=f"Application for {title}",
            message=message,
            evidence_ids=top.evidence_ids if top else [],
        )
    elif not draft.outreach.subject.strip():
        draft.outreach.subject = f"Application for {job.title or 'this role'}"

    draft.interview = [item for item in draft.interview if item.question.strip()]
    if not draft.interview:
        draft.interview = _fallback_interview(evidence, job, matches)

    valid_req_ids = {req.id for req in job.requirements}
    draft.gap_plan = [
        item for item in draft.gap_plan if item.requirement_id in valid_req_ids
    ]
    draft.needs_input = [item for item in draft.needs_input if item.question.strip()]
    return draft


def generate_stage(
    sampler: Sampler,
    job: JobRequirements,
    matches: MatchResult,
    evidence: EvidenceBank,
    answers: list[dict] | None = None,
    *,
    tone: str = "direct, warm, specific",
    level: str | None = None,
) -> KitDraft:
    role_track = detect_role_track(job)
    data = sample_json(
        sampler,
        prompts.generate(
            job.model_dump(),
            matches.model_dump(),
            evidence.model_dump(),
            answers,
            tone=tone,
            level=level or job.seniority,
            role_track=role_track,
        ),
        max_tokens=6144,
    )
    try:
        draft = KitDraft.model_validate(data)
    except ValidationError as exc:
        raise StageError("INVALID_KIT_SHAPE", "The writer returned an invalid structure.") from exc
    return sanitize_kit(draft, job, matches, evidence)


def verify_stage(
    sampler: Sampler, evidence: EvidenceBank, draft: KitDraft
) -> VerifierResult:
    data = sample_json(
        sampler,
        prompts.verify(evidence.model_dump(), draft.model_dump()),
        max_tokens=4096,
    )
    try:
        return VerifierResult.model_validate(data)
    except ValidationError as exc:
        raise StageError("INVALID_VERIFIER_SHAPE", "The verifier returned an invalid structure.") from exc


def _clean_json_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    text = text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]
    text = re.sub(r",\s*([}\]])", r"\1", text)
    return text


def extract_json(text: str) -> Any:
    cleaned = _clean_json_text(text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise StageError(
            "MALFORMED_MODEL_JSON",
            "The model returned an invalid response. Try again.",
        ) from exc


def _sample_text(sampler: Sampler, prompt: str, max_tokens: int) -> str:
    result = sampler.sample(
        prompt,
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
    )
    if isinstance(result, str):
        return result
    if "result" in result and isinstance(result["result"], dict):
        result = result["result"]
    content = result.get("content")
    if isinstance(content, dict):
        text = content.get("text", "")
    elif isinstance(content, list) and content:
        text = content[0].get("text", "") if isinstance(content[0], dict) else ""
    else:
        text = result.get("text", "")
    if not text or not str(text).strip():
        raise StageError("EMPTY_MODEL_RESPONSE", "The model returned an empty response. Try again.")
    return str(text)


def sample_json(sampler: Sampler, prompt: str, *, max_tokens: int) -> dict[str, Any]:
    data = extract_json(_sample_text(sampler, prompt, max_tokens))
    if isinstance(data, dict):
        for key in ("json", "data", "result"):
            if len(data) == 1 and isinstance(data.get(key), dict):
                return data[key]
    return data


def run_pipeline(
    sampler: Sampler,
    cv_text: str,
    job_text: str,
    answers: list[dict] | None = None,
    *,
    tone: str = "direct, warm, specific",
    level: str | None = None,
) -> dict[str, Any]:
    evidence = parse_cv(sampler, cv_text)
    job = parse_job(sampler, job_text)
    matches = match_stage(sampler, job, evidence)
    draft = generate_stage(
        sampler,
        job,
        matches,
        evidence,
        answers,
        tone=tone,
        level=level,
    )
    verifier = verify_stage(sampler, evidence, draft)
    kit, lint = finalize_kit(draft, verifier, evidence, job, matches)
    return {
        "evidence": evidence,
        "job": job,
        "matches": matches,
        "kit": kit,
        "lint": lint,
    }
