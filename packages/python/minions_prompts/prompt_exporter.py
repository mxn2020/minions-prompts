"""
PromptExporter — export prompt templates to external formats.
"""

from __future__ import annotations

from typing import Any

from minions import Minion, Relation

from .storage import PromptStorage
from .prompt_renderer import PromptRenderer
from .prompt_chain import PromptChain
from .types import LangChainExport, LlamaIndexExport, FullJsonExport


class PromptExporter:
    """Exports prompt templates to external formats.

    Args:
        storage: The storage backend.

    Example::

        exporter = PromptExporter(storage)
        langchain_export = exporter.to_lang_chain(prompt_id)
        raw = exporter.to_raw(prompt_id, {"topic": "AI"})
    """

    def __init__(self, storage: PromptStorage) -> None:
        self._storage = storage
        self._renderer = PromptRenderer()
        self._chain = PromptChain(storage)

    def to_raw(self, prompt_id: str, variables: dict[str, Any] | None = None) -> str:
        """Render the prompt as a plain string with variables substituted.

        Args:
            prompt_id: The ID of the prompt to render.
            variables: Variable values to substitute.

        Returns:
            The rendered prompt string.
        """
        prompt = self._storage.get_minion(prompt_id)
        if not prompt:
            raise ValueError(f"Prompt not found: {prompt_id}")
        content = str((prompt.fields or {}).get("content", "") or "")
        return self._renderer.render(content, variables or {}, strict=False)

    def to_lang_chain(self, prompt_id: str) -> LangChainExport:
        """Export to LangChain PromptTemplate format.

        Args:
            prompt_id: The ID of the prompt to export.

        Returns:
            LangChain-compatible export object.
        """
        prompt = self._storage.get_minion(prompt_id)
        if not prompt:
            raise ValueError(f"Prompt not found: {prompt_id}")
        content = str((prompt.fields or {}).get("content", "") or "")
        input_variables = self._renderer.extract_variables(content)
        return LangChainExport(template=content, input_variables=input_variables)

    def to_llama_index(self, prompt_id: str) -> LlamaIndexExport:
        """Export to LlamaIndex PromptTemplate format.

        Args:
            prompt_id: The ID of the prompt to export.

        Returns:
            LlamaIndex-compatible export object.
        """
        prompt = self._storage.get_minion(prompt_id)
        if not prompt:
            raise ValueError(f"Prompt not found: {prompt_id}")
        content = str((prompt.fields or {}).get("content", "") or "")
        template_vars = self._renderer.extract_variables(content)
        return LlamaIndexExport(template=content, template_vars=template_vars)

    def to_json(self, prompt_id: str) -> FullJsonExport:
        """Export to full JSON including version history and test results.

        Args:
            prompt_id: The ID of the prompt to export.

        Returns:
            FullJsonExport dataclass.
        """
        from datetime import datetime, timezone
        prompt = self._storage.get_minion(prompt_id)
        if not prompt:
            raise ValueError(f"Prompt not found: {prompt_id}")

        try:
            versions = self._chain.get_version_chain(prompt_id)
        except Exception:
            versions = [prompt]

        all_relations: list[Relation] = []
        test_results: list[Minion] = []
        seen_result_ids: set[str] = set()

        for version in versions:
            refs = self._storage.get_relations(target_id=version.id, type="references")
            for rel in refs:
                all_relations.append(rel)
                if rel.source_id not in seen_result_ids:
                    result_minion = self._storage.get_minion(rel.source_id)
                    if result_minion:
                        test_results.append(result_minion)
                        seen_result_ids.add(rel.source_id)

        return FullJsonExport(
            prompt=prompt,
            versions=[v for v in versions if v.id != prompt_id],
            test_results=test_results,
            relations=all_relations,
            exported_at=datetime.now(timezone.utc).isoformat(),
        )
