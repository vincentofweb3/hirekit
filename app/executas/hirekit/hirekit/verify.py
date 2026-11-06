"""Verifier application and deterministic honesty enforcement."""

from __future__ import annotations

import re
from typing import Iterable

from .checks import unsupported_title
from .lint import lint_kit
from .models import (
    EvidenceBank,
    GapPlanItem,
    InterviewItem,
    JobRequirements,
    Kit,
    KitDraft,
    LetterParagraph,
    LintItem,
    MatchResult,
    NeedsInput,
    Outreach,
    VerifierResult,
)
from .scoring import compute_fit
from .taxonomy import find_technologies


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


def _evidence_technologies(evidence: EvidenceBank) -> set[str]:
    blob = "\n".join(
        part
        for item in evidence.items
        for part in [item.source_quote, *item.facts, *item.skills, *item.stack]
    )
    return find_technologies(blob)


def _path_index(path: str) -> tuple[str, int]:
    match = re.match(r"([a-z_]+)\[(\d+)\]", path)
    if not match:
        return path, -1
    return match.group(1), int(match.group(2))


def _set_path(kit: KitDraft, path: str, value: str) -> bool:
    section, index = _path_index(path)
    if section == "bullets" and index >= 0 and index < len(kit.bullets):
        kit.bullets[index].text = value
        return True
    if section == "cover_letter" and path.startswith("cover_letter.paragraphs["):
        if index < len(kit.cover_letter.paragraphs):
            kit.cover_letter.paragraphs[index].text = value
            return True
    if path == "outreach.message":
        kit.outreach.message = value
        return True
    if section == "interview" and path.endswith(".answer_outline") and index < len(kit.interview):
        kit.interview[index].answer_outline = [value]
        return True
    if section == "gap_plan" and path.endswith(".honest_phrasing") and index < len(kit.gap_plan):
        kit.gap_plan[index].honest_phrasing = value
        return True
    return False


def _remove_path(kit: KitDraft, path: str) -> bool:
    section, index = _path_index(path)
    if section == "bullets" and index >= 0 and index < len(kit.bullets):
        del kit.bullets[index]
        return True
    if path.startswith("cover_letter.paragraphs[") and index < len(kit.cover_letter.paragraphs):
        del kit.cover_letter.paragraphs[index]
        return True
    if path == "outreach.message":
        kit.outreach.message = ""
        return True
    if section == "interview" and index < len(kit.interview):
        kit.interview[index].answer_outline = []
        return True
    if section == "gap_plan" and index < len(kit.gap_plan):
        kit.gap_plan[index].honest_phrasing = "No verified experience yet; this is a gap to address."
        return True
    return False


def _removal_sort_key(path: str) -> tuple[str, int]:
    section, index = _path_index(path)
    return section, -index


def _add_question(
    questions: list[NeedsInput],
    question: str,
    relates_to: str = "",
    *,
    qid: str = "",
) -> None:
    clean = question.strip()
    if not clean:
        return
    if any(existing.question.strip().lower() == clean.lower() for existing in questions):
        return
    questions.append(
        NeedsInput(
            id=qid or f"q_{len(questions) + 1}",
            question=clean,
            relates_to=relates_to,
        )
    )


def apply_verifier(kit: KitDraft, result: VerifierResult) -> list[NeedsInput]:
    questions: list[NeedsInput] = []
    rewrites: dict[str, str] = {}
    removals: set[str] = set()
    for item in result.items:
        if item.supported:
            continue
        path = item.path.strip()
        if item.rewrite.strip():
            rewrites[path] = item.rewrite.strip()
        else:
            removals.add(path)
        if item.reason.strip():
            _add_question(
                questions,
                f"Can you provide evidence for this line: {item.reason.strip()}",
                path,
            )
    for path, value in rewrites.items():
        _set_path(kit, path, value)
    for path in sorted(removals, key=_removal_sort_key):
        _remove_path(kit, path)
    return questions


def _drop_unsupported_bullets(
    kit: KitDraft,
    evidence: EvidenceBank,
    job: JobRequirements | None = None,
) -> list[NeedsInput]:
    questions: list[NeedsInput] = []
    known_ids = set(evidence.by_id())
    known_numbers = _evidence_numbers(evidence)
    known_tech = _evidence_technologies(evidence)
    kept = []
    for bullet in kit.bullets:
        missing = [eid for eid in bullet.evidence_ids if eid not in known_ids]
        invented = _numbers(bullet.text) - known_numbers
        unknown_tech = find_technologies(bullet.text) - known_tech
        inflated_title = unsupported_title(bullet.text, evidence, job)
        if not bullet.text.strip():
            continue
        if missing or invented or unknown_tech or inflated_title:
            reason = []
            if missing:
                reason.append("unknown evidence")
            if invented:
                reason.append("unverified number")
            if unknown_tech:
                reason.append("unverified technology")
            if inflated_title:
                reason.append(f"title not in the CV ({inflated_title})")
            _add_question(
                questions,
                f"Can you verify the claim in this bullet ({', '.join(reason)}): {bullet.before or bullet.text}",
                bullet.evidence_ids[0] if bullet.evidence_ids else "",
            )
            continue
        if not bullet.evidence_ids:
            _add_question(
                questions,
                f"Which project or role supports this bullet: {bullet.text}",
            )
            continue
        kept.append(bullet)
    kit.bullets = kept
    return questions


def _clean_cover_letter(
    kit: KitDraft,
    evidence: EvidenceBank,
    job: JobRequirements | None = None,
) -> list[NeedsInput]:
    questions: list[NeedsInput] = []
    known_ids = set(evidence.by_id())
    known_numbers = _evidence_numbers(evidence)
    known_tech = _evidence_technologies(evidence)
    kept = []
    for paragraph in kit.cover_letter.paragraphs:
        if paragraph.kind != "body":
            kept.append(paragraph)
            continue
        if not paragraph.text.strip():
            continue
        if any(eid not in known_ids for eid in paragraph.evidence_ids):
            _add_question(
                questions,
                f"Which evidence supports this cover-letter paragraph: {paragraph.text}",
            )
            continue
        if _numbers(paragraph.text) - known_numbers:
            _add_question(
                questions,
                f"Can you verify the number in this cover-letter paragraph: {paragraph.text}",
            )
            continue
        if find_technologies(paragraph.text) - known_tech:
            _add_question(
                questions,
                f"Can you verify the technology in this cover-letter paragraph: {paragraph.text}",
            )
            continue
        inflated_title = unsupported_title(
            paragraph.text, evidence, job, allow_job_title=True
        )
        if inflated_title:
            _add_question(
                questions,
                f"Can you verify the title in this cover-letter paragraph ({inflated_title}): {paragraph.text}",
            )
            continue
        if not paragraph.evidence_ids:
            _add_question(
                questions,
                f"Which evidence supports this cover-letter paragraph: {paragraph.text}",
            )
            continue
        kept.append(paragraph)
    kit.cover_letter.paragraphs = kept
    return questions


def _clean_outreach(
    kit: KitDraft,
    evidence: EvidenceBank,
    job: JobRequirements | None = None,
) -> list[NeedsInput]:
    questions: list[NeedsInput] = []
    message = kit.outreach.message.strip()
    if not message:
        return questions
    known_ids = set(evidence.by_id())
    if any(eid not in known_ids for eid in kit.outreach.evidence_ids):
        kit.outreach.message = ""
        _add_question(questions, f"Which evidence supports this outreach message: {message}")
        return questions
    if _numbers(message) - _evidence_numbers(evidence):
        kit.outreach.message = ""
        _add_question(questions, f"Can you verify the number in this outreach message: {message}")
        return questions
    if find_technologies(message) - _evidence_technologies(evidence):
        kit.outreach.message = ""
        _add_question(questions, f"Can you verify the technology in this outreach message: {message}")
        return questions
    inflated_title = unsupported_title(message, evidence, job, allow_job_title=True)
    if inflated_title:
        kit.outreach.message = ""
        _add_question(
            questions,
            f"Can you verify the title in this outreach message ({inflated_title}): {message}",
        )
        return questions
    if not kit.outreach.evidence_ids:
        kit.outreach.message = ""
        _add_question(questions, f"Which evidence supports this outreach message: {message}")
    return questions


def _clean_interview(
    kit: KitDraft,
    evidence: EvidenceBank,
    job: JobRequirements | None = None,
) -> list[NeedsInput]:
    questions: list[NeedsInput] = []
    known_ids = set(evidence.by_id())
    known_numbers = _evidence_numbers(evidence)
    known_tech = _evidence_technologies(evidence)
    for item in kit.interview:
        if not item.answer_outline:
            continue
        text = " ".join(item.answer_outline)
        if any(eid not in known_ids for eid in item.evidence_ids):
            item.answer_outline = []
            _add_question(questions, f"Which evidence supports this interview answer: {text}")
            continue
        if _numbers(text) - known_numbers:
            item.answer_outline = []
            _add_question(questions, f"Can you verify the number in this interview answer: {text}")
            continue
        if item.evidence_ids and find_technologies(text) - known_tech:
            item.answer_outline = []
            _add_question(questions, f"Can you verify the technology in this interview answer: {text}")
            continue
        inflated_title = unsupported_title(text, evidence, job)
        if inflated_title:
            item.answer_outline = []
            _add_question(
                questions,
                f"Can you verify the title in this interview answer ({inflated_title}): {text}",
            )
    return questions


def _restore_sections(kit: KitDraft, job: JobRequirements) -> None:
    kit.interview = [item for item in kit.interview if item.question.strip() and item.answer_outline]
    if not kit.bullets:
        return
    top = kit.bullets[0]

    paragraphs = [p for p in kit.cover_letter.paragraphs if p.text.strip()]
    if not any(p.kind == "body" for p in paragraphs):
        if not any(p.kind == "greeting" for p in paragraphs):
            paragraphs.insert(0, LetterParagraph(text="Dear Hiring Manager,", kind="greeting"))
        if not any(p.kind == "closing" for p in paragraphs):
            paragraphs.append(LetterParagraph(text="Sincerely,", kind="closing"))
        body = LetterParagraph(
            text=top.text,
            evidence_ids=top.evidence_ids,
            kind="body",
        )
        insert_at = next(
            (index + 1 for index, p in enumerate(paragraphs) if p.kind == "greeting"),
            0,
        )
        paragraphs.insert(insert_at, body)
    kit.cover_letter.paragraphs = paragraphs

    if not kit.outreach.message.strip():
        title = job.title or "this role"
        company = job.company or "your team"
        kit.outreach = Outreach(
            subject=f"Application for {title}",
            message=(
                f"Hello,\n\nI am applying for {title} at {company}. {top.text}\n\n"
                "Thank you for your time."
            ),
            evidence_ids=top.evidence_ids,
        )

    if not kit.interview:
        kit.interview = [
            InterviewItem(
                question=f"Walk me through {top.before or top.text}.",
                why_asked="Interviewers will ask about the work you choose to highlight.",
                answer_outline=[top.text],
                evidence_ids=top.evidence_ids,
            )
        ]


def _ensure_gaps(
    kit: KitDraft,
    job: JobRequirements,
    matches: MatchResult,
) -> list[NeedsInput]:
    questions: list[NeedsInput] = []
    by_req = matches.by_requirement()
    gap_ids = [
        req.id
        for req in job.requirements
        if not by_req.get(req.id) or by_req[req.id].status == "gap"
    ]
    plan_ids = {item.requirement_id for item in kit.gap_plan}
    question_ids = {item.relates_to for item in kit.needs_input}
    for req_id in gap_ids:
        req = next((r for r in job.requirements if r.id == req_id), None)
        if req is None:
            continue
        if req_id not in plan_ids:
            kit.gap_plan.append(
                GapPlanItem(
                    requirement_id=req_id,
                    honest_phrasing="No verified experience yet; this is a gap to address.",
                    action="Build a small project or complete a focused course, then add the evidence.",
                    effort="1 week",
                )
            )
        if req_id not in question_ids:
            _add_question(
                questions,
                f"What class, project, or work example shows {req.text}? If none, say so.",
                req_id,
                qid=f"q_{req_id}",
            )
    for bullet in kit.bullets:
        if bullet.needs_number:
            _add_question(
                questions,
                f"What real number can you verify for this bullet: {bullet.before or bullet.text}",
                bullet.evidence_ids[0] if bullet.evidence_ids else "",
            )
    return questions


def merge_questions(kit: KitDraft, new_questions: Iterable[NeedsInput]) -> None:
    for question in new_questions:
        _add_question(
            kit.needs_input,
            question.question,
            question.relates_to,
            qid=question.id,
        )


def finalize_kit(
    draft: KitDraft,
    verifier: VerifierResult,
    evidence: EvidenceBank,
    job: JobRequirements,
    matches: MatchResult,
) -> tuple[Kit, list[LintItem]]:
    merge_questions(draft, apply_verifier(draft, verifier))
    merge_questions(draft, _drop_unsupported_bullets(draft, evidence, job))
    merge_questions(draft, _clean_cover_letter(draft, evidence, job))
    merge_questions(draft, _clean_outreach(draft, evidence, job))
    merge_questions(draft, _clean_interview(draft, evidence, job))
    _restore_sections(draft, job)
    merge_questions(draft, _ensure_gaps(draft, job, matches))
    fit = compute_fit(job, matches, evidence)
    kit = Kit(**draft.model_dump(), fit=fit)
    lint = lint_kit(kit, evidence, job, matches)
    return kit, lint
