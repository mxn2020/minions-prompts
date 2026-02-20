"""Tests for PromptExporter."""

import pytest
from datetime import datetime, timezone
from minions import Minion
from minions_prompts import PromptExporter
from minions_prompts.storage import InMemoryStorage


def make_prompt(id: str, content: str) -> Minion:
    now = datetime.now(timezone.utc).isoformat()
    return Minion(
        id=id,
        title="Test Prompt",
        minion_type_id="minions-prompts/prompt-template",
        fields={"content": content},
        created_at=now,
        updated_at=now,
    )


@pytest.fixture
def storage():
    return InMemoryStorage()


@pytest.fixture
def exporter(storage):
    return PromptExporter(storage)


def test_to_raw_renders_variables(storage, exporter):
    storage.save_minion(make_prompt("p1", "Hello {{name}}, you are {{role}}!"))

    raw = exporter.to_raw("p1", {"name": "Alice", "role": "admin"})
    assert raw == "Hello Alice, you are admin!"


def test_to_raw_static_prompt(storage, exporter):
    storage.save_minion(make_prompt("p2", "Static prompt with no variables"))

    raw = exporter.to_raw("p2", {})
    assert raw == "Static prompt with no variables"


def test_to_langchain_returns_template_and_variables(storage, exporter):
    storage.save_minion(make_prompt("p3", "Write about {{topic}} for {{audience}}"))

    lc = exporter.to_lang_chain("p3")
    assert lc.template == "Write about {{topic}} for {{audience}}"
    assert "topic" in lc.input_variables
    assert "audience" in lc.input_variables


def test_to_langchain_empty_variables(storage, exporter):
    storage.save_minion(make_prompt("p4", "No variables here"))

    lc = exporter.to_lang_chain("p4")
    assert lc.input_variables == []


def test_to_llamaindex_returns_template_and_vars(storage, exporter):
    storage.save_minion(make_prompt("p5", "Summarize {{content}} in {{length}} words"))

    li = exporter.to_llama_index("p5")
    assert li.template == "Summarize {{content}} in {{length}} words"
    assert "content" in li.template_vars
    assert "length" in li.template_vars


def test_to_json_returns_structured_export(storage, exporter):
    storage.save_minion(make_prompt("p6", "Hello {{name}}"))

    export = exporter.to_json("p6")
    assert export.prompt.id == "p6"
    assert isinstance(export.versions, list)
    assert isinstance(export.test_results, list)
    assert isinstance(export.relations, list)
    assert export.exported_at is not None


def test_to_json_raises_for_unknown_prompt(exporter):
    with pytest.raises((ValueError, KeyError, Exception)):
        exporter.to_json("nonexistent")
