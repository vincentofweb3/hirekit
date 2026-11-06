from hirekit.taxonomy import (
    canonical,
    claim_risks,
    find_technologies,
    keyword_coverage,
    related,
)


def test_stack_has_at_least_300_entries():
    from hirekit.taxonomy import ENTRIES

    assert len(ENTRIES) >= 300


def test_alias_resolution():
    assert canonical("Postgres") == "PostgreSQL"
    assert canonical("psql") == "PostgreSQL"
    assert canonical("k8s") == "Kubernetes"
    assert canonical("JS") == "JavaScript"
    assert canonical("TS") == "TypeScript"
    assert canonical("NodeJS") == "Node.js"


def test_related_is_not_equal():
    assert "GitHub Actions" in related("Jenkins")
    assert "GitHub Actions" not in find_technologies("Jenkins")
    assert "PostgreSQL" in related("SQL")


def test_single_letter_languages_are_case_sensitive():
    assert find_technologies("I write C and R.") == {"C", "R"}
    assert "C" not in find_technologies("I write React.")
    assert "R" not in find_technologies("I write Rust.")


def test_no_go_false_positive():
    assert "Go" not in find_technologies("I used Google Cloud.")


def test_keyword_coverage():
    evidence = [
        {
            "type": "project",
            "title": "API",
            "facts": ["Built a Python API"],
            "skills": ["Python", "PostgreSQL"],
        }
    ]
    coverage = keyword_coverage(["Python", "SQL", "Kubernetes"], evidence)
    assert coverage["found"] == ["Python"]
    assert coverage["missing"] == ["SQL", "Kubernetes"]


def test_claim_risks_flags_skill_without_project_evidence():
    risks = claim_risks(
        [
            {
                "id": "ev_1",
                "type": "project",
                "title": "API",
                "facts": ["Built a Python API"],
                "skills": ["Python", "Kubernetes"],
            }
        ]
    )
    assert any(risk["technology"] == "Kubernetes" for risk in risks)
