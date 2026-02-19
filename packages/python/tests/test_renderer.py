"""Tests for PromptRenderer."""

import pytest
from minions_prompts import PromptRenderer, RendererError


@pytest.fixture
def renderer():
    return PromptRenderer()


def test_simple_substitution(renderer):
    result = renderer.render("Hello, {{name}}!", {"name": "World"})
    assert result == "Hello, World!"


def test_multiple_variables(renderer):
    result = renderer.render("{{greeting}}, {{name}}!", {"greeting": "Hi", "name": "Alice"})
    assert result == "Hi, Alice!"


def test_if_block_truthy(renderer):
    result = renderer.render("Start {{#if show}}middle {{/if}}end", {"show": True})
    assert result == "Start middle end"


def test_if_block_falsy(renderer):
    result = renderer.render("Start {{#if show}}middle {{/if}}end", {"show": False})
    assert result == "Start end"


def test_each_block(renderer):
    result = renderer.render("{{#each items}}{{this}} {{/each}}", {"items": ["a", "b", "c"]})
    assert result == "a b c "


def test_missing_required_variable(renderer):
    with pytest.raises(RendererError) as exc_info:
        renderer.render("Hello {{name}}", {}, required_variables=["name"])
    assert "name" in exc_info.value.missing_variables


def test_extract_variables(renderer):
    variables = renderer.extract_variables("Hello {{name}}, you are {{role}}!")
    assert "name" in variables
    assert "role" in variables


def test_numeric_value(renderer):
    result = renderer.render("Count: {{count}}", {"count": 42})
    assert result == "Count: 42"


def test_boolean_value(renderer):
    result = renderer.render("Active: {{active}}", {"active": True})
    assert result == "Active: True"
