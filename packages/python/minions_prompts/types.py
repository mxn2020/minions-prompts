"""
Domain-specific type definitions for minions-prompts.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

from minions import Minion, Relation

# ─── Variable Types ───────────────────────────────────────────────────────────

PromptVariableType = Literal["string", "number", "boolean", "array", "object"]


@dataclass
class PromptVariable:
    """A typed variable definition for use in prompt templates."""

    name: str
    type: PromptVariableType
    required: bool
    description: str | None = None
    default_value: Any = None
    example: str | None = None


# ─── Field Containers ─────────────────────────────────────────────────────────


@dataclass
class PromptTemplateFields:
    """Fields for a prompt-template minion."""

    content: str
    description: str | None = None
    variables: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)


@dataclass
class PromptVersionFields:
    """Fields for a prompt-version minion."""

    content: str
    description: str | None = None
    version_number: int | None = None
    changelog: str | None = None
    variables: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)


@dataclass
class PromptVariableFields:
    """Fields for a prompt-variable minion."""

    variable_type: PromptVariableType
    required: bool
    description: str | None = None
    default_value: str | None = None
    example: str | None = None


@dataclass
class PromptTestFields:
    """Fields for a prompt-test minion."""

    input_variables: dict[str, Any] = field(default_factory=dict)
    expected_criteria: str | None = None
    scoring_dimensions: list[str] = field(default_factory=list)


@dataclass
class PromptResultFields:
    """Fields for a prompt-result minion."""

    rendered_prompt: str
    scores: dict[str, float] = field(default_factory=dict)
    passed: bool = False
    output: str | None = None
    metadata: dict[str, Any] | None = None


# ─── Diff Types ───────────────────────────────────────────────────────────────


@dataclass
class DiffLine:
    """A single line in a content-level diff."""

    type: Literal["add", "remove", "context"]
    text: str
    line_number: int | None = None


@dataclass
class DiffResult:
    """Result of comparing two prompt versions field by field."""

    added: list[dict[str, Any]] = field(default_factory=list)
    """Fields present in v2 but not v1."""

    removed: list[dict[str, Any]] = field(default_factory=list)
    """Fields present in v1 but not v2."""

    changed: list[dict[str, Any]] = field(default_factory=list)
    """Fields present in both but different."""

    content_diff: list[DiffLine] = field(default_factory=list)
    """Line-level diff of the content field."""


# ─── Export Types ─────────────────────────────────────────────────────────────


@dataclass
class LangChainExport:
    """LangChain PromptTemplate-compatible export."""

    template: str
    input_variables: list[str]
    output_parser: None = None


@dataclass
class LlamaIndexExport:
    """LlamaIndex PromptTemplate-compatible export."""

    template: str
    template_vars: list[str]


@dataclass
class FullJsonExport:
    """Full structured export including version history and test results."""

    prompt: Minion
    versions: list[Minion]
    test_results: list[Minion]
    relations: list[Relation]
    exported_at: str


# ─── Result Types ─────────────────────────────────────────────────────────────


@dataclass
class TestRunResult:
    """Result of a single test execution."""

    prompt_id: str
    test_id: str
    rendered_prompt: str
    scores: dict[str, float]
    passed: bool
    result: Minion


@dataclass
class ComparisonResult:
    """Result of an A/B comparison between two prompt versions."""

    v1_id: str
    v2_id: str
    test_id: str
    v1_result: TestRunResult
    v2_result: TestRunResult
    deltas: dict[str, float]
    winner: Literal["v1", "v2", "tie"]
