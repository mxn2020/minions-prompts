"""Tests for PromptScorer."""

import pytest
from datetime import datetime, timezone
from minions import Minion
from minions_prompts import PromptScorer
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


def make_test(id: str, input_variables: dict) -> Minion:
    now = datetime.now(timezone.utc).isoformat()
    return Minion(
        id=id,
        title="Test Case",
        minion_type_id="minions-prompts/prompt-test",
        fields={"inputVariables": input_variables},
        created_at=now,
        updated_at=now,
    )


@pytest.fixture
def storage():
    return InMemoryStorage()


@pytest.fixture
def scorer(storage):
    return PromptScorer(storage)


def test_run_test_renders_prompt(storage, scorer):
    storage.save_minion(make_prompt("p1", "Hello {{name}}"))
    storage.save_minion(make_test("t1", {"name": "World"}))

    result = scorer.run_test("p1", "t1", scores={"relevance": 80}, passed=True)
    assert result.rendered_prompt == "Hello World"


def test_run_test_returns_scores_and_pass_status(storage, scorer):
    storage.save_minion(make_prompt("p2", "Summarize {{topic}}"))
    storage.save_minion(make_test("t2", {"topic": "AI"}))

    result = scorer.run_test("p2", "t2", scores={"coherence": 90, "accuracy": 75}, passed=True)
    assert result.passed is True
    assert result.scores["coherence"] == 90
    assert result.scores["accuracy"] == 75


def test_run_test_saves_result_minion(storage, scorer):
    storage.save_minion(make_prompt("p3", "Write about {{topic}}"))
    storage.save_minion(make_test("t3", {"topic": "TypeScript"}))

    scorer.run_test("p3", "t3", scores={"relevance": 85}, passed=True)

    all_minions = storage.get_all_minions()
    result_minion = next(
        (m for m in all_minions if m.minion_type_id == "minions-prompts/prompt-result"),
        None
    )
    assert result_minion is not None
    assert result_minion.fields["passed"] is True


def test_run_test_suite_runs_all_tests(storage, scorer):
    storage.save_minion(make_prompt("p4", "{{x}}"))
    storage.save_minion(make_test("t4a", {"x": "alpha"}))
    storage.save_minion(make_test("t4b", {"x": "beta"}))

    results = scorer.run_test_suite(
        "p4",
        ["t4a", "t4b"],
        [
            {"scores": {"relevance": 70}, "passed": True},
            {"scores": {"relevance": 80}, "passed": True},
        ],
    )

    assert len(results) == 2
    assert results[0].rendered_prompt == "alpha"
    assert results[1].rendered_prompt == "beta"


def test_compare_versions_determines_winner(storage, scorer):
    storage.save_minion(make_prompt("v1", "Version A {{x}}"))
    storage.save_minion(make_prompt("v2", "Version B {{x}}"))
    storage.save_minion(make_test("tc", {"x": "test"}))

    comparisons = scorer.compare_versions(
        "v1",
        "v2",
        ["tc"],
        [{"scores": {"accuracy": 60}, "passed": False}],
        [{"scores": {"accuracy": 80}, "passed": True}],
    )

    assert len(comparisons) == 1
    assert comparisons[0].winner == "v2"
    assert comparisons[0].deltas["accuracy"] == 20


def test_compare_versions_tie(storage, scorer):
    storage.save_minion(make_prompt("va", "A {{x}}"))
    storage.save_minion(make_prompt("vb", "B {{x}}"))
    storage.save_minion(make_test("tb", {"x": "foo"}))

    comparisons = scorer.compare_versions(
        "va",
        "vb",
        ["tb"],
        [{"scores": {"relevance": 75}, "passed": True}],
        [{"scores": {"relevance": 75}, "passed": True}],
    )

    assert comparisons[0].winner == "tie"
