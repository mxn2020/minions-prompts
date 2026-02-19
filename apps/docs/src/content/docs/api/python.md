---
title: Python API Reference
description: Complete API reference for the minions-prompts Python SDK.
---

## Installation

```bash
pip install minions-prompts
```

## PromptChain

```python
class PromptChain:
    def __init__(self, storage: PromptStorage) -> None: ...

    def get_version_chain(self, prompt_id: str) -> list[Minion]: ...
    def get_latest_version(self, prompt_id: str) -> Minion: ...
    def get_version_at_date(self, prompt_id: str, date: datetime) -> Minion | None: ...
```

## PromptRenderer

```python
class PromptRenderer:
    def render(
        self,
        template: str,
        variables: dict[str, Any] | None = None,
        *,
        strict: bool = True,
        required_variables: list[str] | None = None,
    ) -> str: ...

    def extract_variables(self, template: str) -> list[str]: ...
```

## PromptDiff

```python
class PromptDiff:
    def diff(self, v1: Minion, v2: Minion) -> DiffResult: ...
    def format(self, result: DiffResult, *, colored: bool = False) -> str: ...
```

## PromptScorer

```python
class PromptScorer:
    def __init__(self, storage: PromptStorage) -> None: ...

    def run_test(
        self,
        prompt_id: str,
        test_id: str,
        *,
        scores: dict[str, float],
        passed: bool,
        output: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> TestRunResult: ...

    def run_test_suite(
        self,
        prompt_id: str,
        test_ids: list[str],
        evaluations: list[dict[str, Any]],
    ) -> list[TestRunResult]: ...

    def compare_versions(
        self,
        v1_id: str,
        v2_id: str,
        test_ids: list[str],
        v1_evaluations: list[dict[str, Any]],
        v2_evaluations: list[dict[str, Any]],
    ) -> list[ComparisonResult]: ...
```

## PromptExporter

```python
class PromptExporter:
    def __init__(self, storage: PromptStorage) -> None: ...

    def to_raw(self, prompt_id: str, variables: dict[str, Any] | None = None) -> str: ...
    def to_lang_chain(self, prompt_id: str) -> LangChainExport: ...
    def to_llama_index(self, prompt_id: str) -> LlamaIndexExport: ...
    def to_json(self, prompt_id: str) -> FullJsonExport: ...
```

## InMemoryStorage

```python
class InMemoryStorage(PromptStorage):
    def get_minion(self, id: str) -> Minion | None: ...
    def save_minion(self, minion: Minion) -> None: ...
    def get_relations(
        self,
        *,
        source_id: str | None = None,
        target_id: str | None = None,
        type: str | None = None,
    ) -> list[Relation]: ...
    def save_relation(self, relation: Relation) -> None: ...
    def get_all_minions(self) -> list[Minion]: ...
    def get_all_relations(self) -> list[Relation]: ...
    def clear(self) -> None: ...
```

## Data Classes

```python
@dataclass
class DiffResult:
    added: list[dict[str, Any]]
    removed: list[dict[str, Any]]
    changed: list[dict[str, Any]]
    content_diff: list[DiffLine]

@dataclass
class LangChainExport:
    template: str
    input_variables: list[str]
    output_parser: None = None

@dataclass
class LlamaIndexExport:
    template: str
    template_vars: list[str]

@dataclass
class TestRunResult:
    prompt_id: str
    test_id: str
    rendered_prompt: str
    scores: dict[str, float]
    passed: bool
    result: Minion

@dataclass
class ComparisonResult:
    v1_id: str
    v2_id: str
    test_id: str
    v1_result: TestRunResult
    v2_result: TestRunResult
    deltas: dict[str, float]
    winner: Literal["v1", "v2", "tie"]
```
