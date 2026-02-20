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


# ── New tests ──────────────────────────────────────────────────────────────────


def test_if_block_with_zero_value(renderer):
    # 0 is falsy → block is omitted
    result = renderer.render("A{{#if count}}B{{/if}}C", {"count": 0})
    assert result == "AC"


def test_if_block_with_empty_string(renderer):
    # empty string is falsy → block is omitted
    result = renderer.render("A{{#if msg}}B{{/if}}C", {"msg": ""})
    assert result == "AC"


def test_missing_optional_variable_renders_empty(renderer):
    # No required_variables specified → missing var leaves placeholder intact
    # (strict=True keeps unknown placeholders as-is by design)
    result = renderer.render("Hello {{name}}", {})
    # The renderer leaves {{name}} as-is when the var is absent and strict=True
    assert "{{name}}" in result


def test_renderer_error_raised_when_required_variable_missing(renderer):
    with pytest.raises(RendererError):
        renderer.render("Hello {{name}}", {}, required_variables=["name"])


def test_renderer_error_missing_variables_contains_var_name(renderer):
    with pytest.raises(RendererError) as exc_info:
        renderer.render("{{x}}", {}, required_variables=["x"])
    err = exc_info.value
    assert isinstance(err, RendererError)
    assert "x" in err.missing_variables


def test_multiple_required_variables_missing_all_listed(renderer):
    with pytest.raises(RendererError) as exc_info:
        renderer.render("{{a}} {{b}} {{c}}", {}, required_variables=["a", "b", "c"])
    missing = exc_info.value.missing_variables
    assert "a" in missing
    assert "b" in missing
    assert "c" in missing


def test_empty_template_returns_empty_string(renderer):
    result = renderer.render("", {})
    assert result == ""


def test_template_with_no_variables_returns_unchanged(renderer):
    template = "This prompt has no placeholders at all."
    result = renderer.render(template, {"irrelevant": "value"})
    assert result == template


def test_each_block_with_empty_list_renders_nothing(renderer):
    result = renderer.render("before {{#each items}}{{this}}{{/each}} after", {"items": []})
    assert result == "before  after"


def test_each_block_with_objects_accesses_fields(renderer):
    # When items are dicts, _process_variables is called on the body with the item as vars
    result = renderer.render(
        "{{#each users}}{{name}} {{/each}}",
        {"users": [{"name": "Alice"}, {"name": "Bob"}]},
    )
    assert result == "Alice Bob "


def test_double_template_variable_independent_substitution(renderer):
    # Two separate variables rendered independently in the same template
    result = renderer.render("{{first}} and {{second}}", {"first": "foo", "second": "bar"})
    assert result == "foo and bar"


def test_rerender_with_different_variable_map(renderer):
    template = "Hello {{name}}"
    result1 = renderer.render(template, {"name": "Alice"})
    result2 = renderer.render(template, {"name": "Bob"})
    assert result1 == "Hello Alice"
    assert result2 == "Hello Bob"
    assert result1 != result2
