"""Deterministic fit scoring and role-track selection."""

from __future__ import annotations

from typing import Iterable

from .models import EvidenceBank, Fit, JobRequirements, MatchResult

_STATUS_VALUE = {"covered": 1.0, "partial": 0.5, "gap": 0.0}
_BANDS = (
    (80, "Strong fit"),
    (60, "Good fit"),
    (40, "Stretch"),
    (0, "Long shot"),
)

_TRACKS = {
    "Backend": {
        "backend", "api", "apis", "server", "database", "databases", "microservice",
        "microservices", "rest", "graphql", "queue", "queues", "redis", "postgres",
        "postgresql", "mysql", "sql", "java", "spring", "django", "flask", "fastapi",
        "node", "golang", "go", "ruby", "rails", "php", "laravel", "kafka",
    },
    "Frontend": {
        "frontend", "front-end", "react", "vue", "angular", "svelte", "next",
        "typescript", "javascript", "css", "html", "accessibility", "a11y",
        "web", "ui", "redux", "tailwind", "browser", "responsive",
    },
    "Mobile": {
        "mobile", "ios", "android", "swift", "kotlin", "react native", "flutter",
        "dart", "app store", "play store", "jetpack", "swiftui",
    },
    "Data and ML": {
        "data", "machine learning", "ml", "ai", "pandas", "numpy", "pytorch",
        "tensorflow", "scikit", "sql", "spark", "airflow", "dbt", "etl", "pipeline",
        "analytics", "statistics", "experiment", "model", "llm", "nlp", "computer vision",
    },
    "DevOps and SRE": {
        "devops", "sre", "reliability", "kubernetes", "k8s", "docker", "terraform",
        "aws", "gcp", "azure", "ci/cd", "github actions", "gitlab ci", "jenkins",
        "observability", "monitoring", "prometheus", "grafana", "incident", "linux",
        "cloud", "infrastructure", "ansible",
    },
    "Security": {
        "security", "cybersecurity", "appsec", "penetration", "pentest", "threat",
        "vulnerability", "soc", "siem", "cryptography", "oauth", "iam", "secure",
    },
    "QA": {
        "qa", "quality assurance", "testing", "test automation", "selenium",
        "playwright", "cypress", "pytest", "jest", "test strategy", "regression",
    },
}


def _blob(job: JobRequirements) -> str:
    parts = [job.title, *job.keywords]
    for req in job.requirements:
        parts.extend([req.text, *req.keywords])
    return " ".join(parts).lower()


def detect_role_track(job: JobRequirements) -> str:
    blob = _blob(job)
    scores: dict[str, int] = {}
    for track, terms in _TRACKS.items():
        scores[track] = sum(1 for term in terms if term in blob)
    best = max(scores, key=lambda track: scores[track])
    if scores[best] == 0:
        return "Full-stack"
    frontend = scores["Frontend"]
    backend = scores["Backend"]
    if frontend and backend and best in {"Frontend", "Backend"}:
        return "Full-stack"
    return best


def keyword_bonus(keyword_coverage: dict[str, list[str]]) -> int:
    found = len(set(keyword_coverage.get("found", [])))
    total = found + len(set(keyword_coverage.get("missing", [])))
    if total == 0:
        return 0
    return min(5, round(5 * found / total))


def compute_fit(
    job: JobRequirements,
    matches: MatchResult,
    evidence: EvidenceBank,
) -> Fit:
    by_req = matches.by_requirement()
    weighted = 0.0
    total_weight = 0.0
    covered: list[str] = []
    gaps: list[str] = []
    for req in job.requirements:
        weight = 3 if req.kind == "must" else 1
        match = by_req.get(req.id)
        value = _STATUS_VALUE.get(match.status, 0.0) if match else 0.0
        weighted += weight * value
        total_weight += weight
        if match and match.status == "covered":
            covered.append(req.text)
        elif not match or match.status == "gap":
            gaps.append(req.text)

    base = 95 * (weighted / total_weight) if total_weight else 0.0
    score = max(0, min(100, round(base + keyword_bonus(matches.keyword_coverage))))
    band = next(label for threshold, label in _BANDS if score >= threshold)

    must_total = sum(1 for req in job.requirements if req.kind == "must")
    must_covered = sum(
        1
        for req in job.requirements
        if req.kind == "must"
        and by_req.get(req.id)
        and by_req[req.id].status == "covered"
    )
    if must_total:
        summary = (
            f"You directly cover {must_covered} of {must_total} must-have requirements. "
            + (
                "The plan below turns the remaining gaps into honest next steps."
                if gaps
                else "Keep the evidence-specific examples in your application."
            )
        )
    else:
        summary = "This posting has no explicit must-haves; use the gaps and plan below to focus your application."

    evidence_titles = {item.id: item.title for item in evidence.items}
    strengths = []
    for req in job.requirements:
        match = by_req.get(req.id)
        if match and match.status == "covered" and match.evidence_ids:
            names = [evidence_titles.get(eid, eid) for eid in match.evidence_ids[:2]]
            strengths.append(f"{req.text} — {', '.join(names)}")
        if len(strengths) >= 3:
            break

    risks = [f"Gap: {text}" for text in gaps[:2]]
    for risk in matches.claim_risks:
        if len(risks) >= 3:
            break
        risks.append(
            f"Claim risk: {risk.get('technology', 'technology')} is listed but not shown in a role or project."
        )
    if not risks:
        risks = ["No evidence gaps found in this pass."]

    return Fit(
        score=score,
        band=band,
        summary=summary,
        strengths=strengths,
        risks=risks[:3],
    )


def covered_technologies(
    job: JobRequirements, matches: MatchResult, evidence: EvidenceBank
) -> set[str]:
    by_req = matches.by_requirement()
    covered: set[str] = set()
    for req in job.requirements:
        match = by_req.get(req.id)
        if match and match.status in {"covered", "partial"}:
            covered.update(req.keywords)
    return covered


def evidence_ids_for_requirement(matches: Iterable, requirement_id: str) -> list[str]:
    for match in matches:
        if match.requirement_id == requirement_id:
            return list(match.evidence_ids)
    return []
