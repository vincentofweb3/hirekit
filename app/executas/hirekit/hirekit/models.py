"""Schema-validated data models for the HireKit pipeline."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Link(BaseModel):
    model_config = ConfigDict(extra="ignore")
    label: str = ""
    url: str = ""


class Metric(BaseModel):
    model_config = ConfigDict(extra="ignore")
    text: str = ""
    value: str = ""


class EvidenceItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = ""
    type: Literal[
        "experience",
        "project",
        "education",
        "skill",
        "leadership",
        "award",
        "volunteering",
    ] = "experience"
    title: str = ""
    org: str = ""
    dates: str = ""
    facts: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    stack: list[str] = Field(default_factory=list)
    links: list[Link] = Field(default_factory=list)
    metrics: list[Metric] = Field(default_factory=list)
    source_quote: str = ""
    verified_quote: bool = False


class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str = ""
    email: str = ""
    phone: str = ""
    links: list[Link] = Field(default_factory=list)


class EvidenceBank(BaseModel):
    model_config = ConfigDict(extra="ignore")
    items: list[EvidenceItem] = Field(default_factory=list)
    contact: Contact = Field(default_factory=Contact)
    language: str = "en"

    def by_id(self) -> dict[str, EvidenceItem]:
        return {item.id: item for item in self.items if item.id}


class Requirement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = ""
    text: str = ""
    kind: Literal["must", "nice"] = "must"
    category: Literal[
        "language",
        "framework",
        "database",
        "infra",
        "practice",
        "domain",
        "soft",
    ] = "domain"
    keywords: list[str] = Field(default_factory=list)


class JobRequirements(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str = ""
    company: str = ""
    location: str = ""
    seniority: Literal["intern", "junior", "mid", "senior", "unknown"] = "unknown"
    requirements: list[Requirement] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    deadline: str = ""

    def by_id(self) -> dict[str, Requirement]:
        return {req.id: req for req in self.requirements if req.id}


class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    requirement_id: str = ""
    status: Literal["covered", "partial", "gap"] = "gap"
    evidence_ids: list[str] = Field(default_factory=list)
    rationale: str = ""


class Fit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    score: int = 0
    band: str = "Long shot"
    summary: str = ""
    strengths: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)


class MatchResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    matches: list[Match] = Field(default_factory=list)
    fit: Fit = Field(default_factory=Fit)
    keyword_coverage: dict[str, list[str]] = Field(
        default_factory=lambda: {"found": [], "missing": []}
    )
    claim_risks: list[dict] = Field(default_factory=list)

    def by_requirement(self) -> dict[str, Match]:
        return {match.requirement_id: match for match in self.matches}


class Bullet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    text: str = ""
    before: str = ""
    evidence_ids: list[str] = Field(default_factory=list)
    targets: list[str] = Field(default_factory=list)
    needs_number: bool = False


class LetterParagraph(BaseModel):
    model_config = ConfigDict(extra="ignore")
    text: str = ""
    evidence_ids: list[str] = Field(default_factory=list)
    kind: Literal["greeting", "body", "closing"] = "body"


class CoverLetter(BaseModel):
    model_config = ConfigDict(extra="ignore")
    paragraphs: list[LetterParagraph] = Field(default_factory=list)


class Outreach(BaseModel):
    model_config = ConfigDict(extra="ignore")
    subject: str = ""
    message: str = ""
    evidence_ids: list[str] = Field(default_factory=list)


class InterviewItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    question: str = ""
    why_asked: str = ""
    answer_outline: list[str] = Field(default_factory=list)
    evidence_ids: list[str] = Field(default_factory=list)


class GapPlanItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    requirement_id: str = ""
    honest_phrasing: str = ""
    action: str = ""
    effort: str = ""


class NeedsInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = ""
    question: str = ""
    relates_to: str = ""


class KitDraft(BaseModel):
    model_config = ConfigDict(extra="ignore")
    bullets: list[Bullet] = Field(default_factory=list)
    cover_letter: CoverLetter = Field(default_factory=CoverLetter)
    outreach: Outreach = Field(default_factory=Outreach)
    interview: list[InterviewItem] = Field(default_factory=list)
    gap_plan: list[GapPlanItem] = Field(default_factory=list)
    needs_input: list[NeedsInput] = Field(default_factory=list)


class Kit(KitDraft):
    fit: Fit = Field(default_factory=Fit)


class LintItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: Literal["pass", "partial", "fail"] = "pass"
    message: str = ""
    line: str = ""


class VerifierItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    path: str = ""
    supported: bool = True
    reason: str = ""
    rewrite: str = ""


class VerifierResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    items: list[VerifierItem] = Field(default_factory=list)
    questions: list[NeedsInput] = Field(default_factory=list)
