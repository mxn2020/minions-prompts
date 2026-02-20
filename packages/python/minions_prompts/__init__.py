"""
minions-prompts — Python SDK
Version-controlled prompt engineering system built on the Minions SDK.

Usage::

    from minions_prompts import (
        PromptChain, PromptRenderer, PromptDiff, PromptScorer, PromptExporter,
        InMemoryStorage, register_prompt_types,
        prompt_template_type, prompt_version_type,
    )
    from minions import create_minion

    storage = InMemoryStorage()
    renderer = PromptRenderer()
    rendered = renderer.render("Hello, {{name}}!", {"name": "World"})
"""

from __future__ import annotations

__version__ = "0.1.0"

from .schemas import (
    prompt_template_type,
    prompt_version_type,
    prompt_variable_type,
    prompt_test_type,
    prompt_result_type,
    prompt_types,
    register_prompt_types,
)
from .prompt_chain import PromptChain
from .prompt_renderer import PromptRenderer, RendererError
from .prompt_diff import PromptDiff
from .prompt_scorer import PromptScorer
from .prompt_exporter import PromptExporter
from .storage import PromptStorage, InMemoryStorage
from .types import (
    PromptVariableType,
    PromptVariable,
    PromptTemplateFields,
    PromptVersionFields,
    PromptVariableFields,
    PromptTestFields,
    PromptResultFields,
    DiffLine,
    DiffResult,
    LangChainExport,
    LlamaIndexExport,
    FullJsonExport,
    TestRunResult,
    ComparisonResult,
)
from .client import PromptsPlugin, MinionsPrompts

__all__ = [
    # Schemas
    "prompt_template_type",
    "prompt_version_type",
    "prompt_variable_type",
    "prompt_test_type",
    "prompt_result_type",
    "prompt_types",
    "register_prompt_types",
    # Core classes
    "PromptChain",
    "PromptRenderer",
    "RendererError",
    "PromptDiff",
    "PromptScorer",
    "PromptExporter",
    "InMemoryStorage",
    "PromptStorage",
    # Types
    "PromptVariableType",
    "PromptVariable",
    "PromptTemplateFields",
    "PromptVersionFields",
    "PromptVariableFields",
    "PromptTestFields",
    "PromptResultFields",
    "DiffLine",
    "DiffResult",
    "LangChainExport",
    "LlamaIndexExport",
    "FullJsonExport",
    "TestRunResult",
    "ComparisonResult",
    # Client
    "PromptsPlugin",
    "MinionsPrompts",
]
