import pytest

from app.guardrails import (
    GuardrailError,
    extract_json_candidate,
    parse_json_object,
    validate_generated_app_payload,
    validate_single_file_payload,
)


def test_extract_json_candidate_from_fenced_block():
    text = """Here you go:
```json
{\"a\": 1}
```
"""
    assert extract_json_candidate(text) == '{"a": 1}'


def test_parse_json_object_rejects_non_object():
    with pytest.raises(GuardrailError):
        parse_json_object("[1,2,3]")


def test_validate_single_file_payload_normalizes_path_and_content():
    out = '{"path": "src/../src/index.js", "content": "console.log(1)"}'
    payload = validate_single_file_payload(out)
    assert payload.normalized_path() == "src/index.js"
    assert payload.content == "console.log(1)"


def test_validate_generated_app_payload_rejects_traversal():
    out = '{"files": [{"path": "../secret.txt", "content": "x"}], "instructions": ""}'
    with pytest.raises(GuardrailError):
        validate_generated_app_payload(out)


def test_validate_generated_app_payload_rejects_duplicate_paths():
    out = '{"files": [{"path": "a.txt", "content": "x"}, {"path": "a.txt", "content": "y"}], "instructions": ""}'
    with pytest.raises(GuardrailError):
        validate_generated_app_payload(out)


def test_validate_generated_app_payload_accepts_minimal_payload():
    out = '{"files": [{"path": "README.md", "content": "Hello"}], "instructions": "Run it"}'
    payload = validate_generated_app_payload(out)
    assert len(payload.files) == 1
    assert payload.files[0].normalized_path() == "README.md"
