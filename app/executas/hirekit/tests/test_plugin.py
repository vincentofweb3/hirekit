import json

import hirekit_plugin


def test_manifest_declares_sampling_and_tools():
    assert "llm.sample" in hirekit_plugin.MANIFEST["host_capabilities"]
    names = {tool["name"] for tool in hirekit_plugin.MANIFEST["tools"]}
    assert {"parse_cv", "parse_job", "match", "generate", "verify", "ping"} <= names


def test_ping():
    result = hirekit_plugin._invoke("ping", {}, {})
    assert result["success"] is True
    assert result["data"] == {"pong": True}


def test_unknown_tool():
    result = hirekit_plugin._invoke("nope", {}, {})
    assert result["success"] is False
    assert result["data"]["code"] == "UNKNOWN_TOOL"


def test_parse_cv_tool(monkeypatch):
    payload = {
        "items": [
            {
                "type": "project",
                "title": "API",
                "facts": ["Built a Python API."],
                "source_quote": "Built a Python API.",
            }
        ]
    }
    monkeypatch.setattr(
        hirekit_plugin,
        "_request_sampling",
        lambda params, **kwargs: {"content": {"type": "text", "text": json.dumps(payload)}},
    )
    result = hirekit_plugin._invoke(
        "parse_cv",
        {"cv_text": "Jane Doe\njane@example.com\nProjects\n- Built a Python API with Django for a campus course."},
        {"invoke_id": "inv_1"},
    )
    assert result["success"] is True
    assert result["data"]["items"][0]["title"] == "API"
    assert result["meta"]["invoke_id"] == "inv_1"
    assert result["meta"]["calls"]


def test_sampling_error_is_structured(monkeypatch):
    def fail(params, **kwargs):
        raise hirekit_plugin.SamplingError(
            "SAMPLING_NOT_GRANTED", "Sampling is off.", retryable=False
        )

    monkeypatch.setattr(hirekit_plugin, "_request_sampling", fail)
    result = hirekit_plugin._invoke(
        "parse_cv",
        {"cv_text": "Jane Doe\njane@example.com\nProjects\n- Built a Python API with Django for a campus course."},
        {"invoke_id": "inv_1"},
    )
    assert result["success"] is False
    assert result["data"]["code"] == "SAMPLE_REQUIRED"
    assert result["data"]["stage"] == "parse_cv"
    assert result["data"]["params"]["messages"]


def test_precomputed_response_runs_without_sampling(monkeypatch):
    def boom(params, **kwargs):
        raise AssertionError("sampling should not be called")

    monkeypatch.setattr(hirekit_plugin, "_request_sampling", boom)
    payload = {
        "items": [
            {
                "type": "project",
                "title": "API",
                "facts": ["Built a Python API."],
                "source_quote": "Built a Python API.",
            }
        ]
    }
    result = hirekit_plugin._invoke(
        "parse_cv",
        {
            "cv_text": "Jane Doe\njane@example.com\nProjects\n- Built a Python API with Django for a campus course.",
            "precomputed_response": json.dumps(payload),
        },
        {"invoke_id": "inv_1"},
    )
    assert result["success"] is True
    assert result["data"]["items"][0]["title"] == "API"
    assert result["meta"]["calls"][0]["source"] == "precomputed"


def test_sampling_provider_error_is_not_relayed(monkeypatch):
    def fail(params, **kwargs):
        raise hirekit_plugin.SamplingError(
            "SAMPLING_PROVIDER_ERROR", "The provider failed.", retryable=True
        )

    monkeypatch.setattr(hirekit_plugin, "_request_sampling", fail)
    result = hirekit_plugin._invoke(
        "parse_cv",
        {"cv_text": "Jane Doe\njane@example.com\nProjects\n- Built a Python API with Django for a campus course."},
        {"invoke_id": "inv_1"},
    )
    assert result["success"] is False
    assert result["data"]["code"] == "SAMPLING_PROVIDER_ERROR"
