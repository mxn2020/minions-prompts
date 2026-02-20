"""Tests for PromptDiff."""

import pytest
from minions import Minion
from minions_prompts import PromptDiff
from datetime import datetime, timezone


def make_minion(fields: dict, title: str = "Test") -> Minion:
    now = datetime.now(timezone.utc).isoformat()
    return Minion(
        id="test-id",
        title=title,
        minion_type_id="minions-prompts/prompt-version",
        fields=fields,
        created_at=now,
        updated_at=now,
    )


@pytest.fixture
def differ():
    return PromptDiff()


def test_detects_added_fields(differ):
    v1 = make_minion({"content": "hello"})
    v2 = make_minion({"content": "hello", "changelog": "Added feature"})
    result = differ.diff(v1, v2)
    assert any(a["field"] == "changelog" for a in result.added)


def test_detects_removed_fields(differ):
    v1 = make_minion({"content": "hello", "changelog": "old"})
    v2 = make_minion({"content": "hello"})
    result = differ.diff(v1, v2)
    assert any(r["field"] == "changelog" for r in result.removed)


def test_detects_changed_fields(differ):
    v1 = make_minion({"content": "hello world"})
    v2 = make_minion({"content": "hello universe"})
    result = differ.diff(v1, v2)
    assert any(c["field"] == "content" for c in result.changed)


def test_format_output(differ):
    v1 = make_minion({"content": "line one"})
    v2 = make_minion({"content": "line two"})
    result = differ.diff(v1, v2)
    formatted = differ.format(result)
    assert isinstance(formatted, str)


# ── New tests ──────────────────────────────────────────────────────────────────


def test_identical_content_no_added_removed_or_changed(differ):
    v1 = make_minion({"content": "same content"})
    v2 = make_minion({"content": "same content"})
    result = differ.diff(v1, v2)
    assert result.added == []
    assert result.removed == []
    assert result.changed == []


def test_full_replacement_content_field_in_changed(differ):
    v1 = make_minion({"content": "old content"})
    v2 = make_minion({"content": "completely new content"})
    result = differ.diff(v1, v2)
    changed_fields = [c["field"] for c in result.changed]
    assert "content" in changed_fields
    content_change = next(c for c in result.changed if c["field"] == "content")
    assert content_change["from"] == "old content"
    assert content_change["to"] == "completely new content"


def test_single_character_change_detected_as_changed(differ):
    v1 = make_minion({"content": "Hello World"})
    v2 = make_minion({"content": "Hello world"})  # lowercase 'w'
    result = differ.diff(v1, v2)
    assert any(c["field"] == "content" for c in result.changed)


def test_both_empty_fields_no_diff(differ):
    v1 = make_minion({})
    v2 = make_minion({})
    result = differ.diff(v1, v2)
    assert result.added == []
    assert result.removed == []
    assert result.changed == []


def test_multiple_fields_changed_all_in_changed(differ):
    v1 = make_minion({"content": "old content", "description": "old desc"})
    v2 = make_minion({"content": "new content", "description": "new desc"})
    result = differ.diff(v1, v2)
    changed_fields = {c["field"] for c in result.changed}
    assert "content" in changed_fields
    assert "description" in changed_fields


def test_format_output_string_is_non_empty_when_there_are_changes(differ):
    v1 = make_minion({"content": "before"})
    v2 = make_minion({"content": "after"})
    result = differ.diff(v1, v2)
    formatted = differ.format(result)
    assert isinstance(formatted, str)
    assert len(formatted) > 0


def test_format_output_for_identical_prompts_is_minimal(differ):
    v1 = make_minion({"content": "no change"})
    v2 = make_minion({"content": "no change"})
    result = differ.diff(v1, v2)
    formatted = differ.format(result)
    assert isinstance(formatted, str)
    # No changes means no +/- markers in the output
    assert "+" not in formatted
    assert "\n- " not in formatted


def test_added_and_removed_simultaneously(differ):
    # v1 has 'old_field', v2 has 'new_field'; content is shared
    v1 = make_minion({"content": "same", "old_field": "goodbye"})
    v2 = make_minion({"content": "same", "new_field": "hello"})
    result = differ.diff(v1, v2)
    added_fields = {a["field"] for a in result.added}
    removed_fields = {r["field"] for r in result.removed}
    assert "new_field" in added_fields
    assert "old_field" in removed_fields
