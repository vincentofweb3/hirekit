from hirekit.lint import lint_cv
from hirekit.models import EvidenceBank


def test_lint_cv_flags_dates_sensitive_data_and_weak_bullets():
    cv = """Jane Doe
jane@example.com
Date of Birth: 2000-01-01
Experience 2024 - 2022
- Responsible for tests
http://bad
"""
    items = lint_cv(cv, EvidenceBank(), level="intern")
    messages = " ".join(item.message for item in items)
    assert "ends before it starts" in messages
    assert "sensitive personal data" in messages
    assert "action verb" in messages
    assert "malformed" in messages


def test_lint_cv_passes_clean_cv():
    cv = """Jane Doe
jane@example.com
github.com/janedoe

Experience
- Built a Python API in 2025, handling 500 requests per day for a campus course.
- Led a team of 3 students to ship a React dashboard used by 200 students.
- Automated the deployment with GitHub Actions, cutting release time from 20 minutes to 5 minutes.
"""
    items = lint_cv(cv, EvidenceBank(), level="junior")
    assert all(item.status != "fail" for item in items)
