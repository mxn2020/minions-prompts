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
