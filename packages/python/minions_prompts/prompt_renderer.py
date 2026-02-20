"""
PromptRenderer — variable interpolation engine for prompt templates.
"""

from __future__ import annotations

import re
import json
from typing import Any


class RendererError(Exception):
    """Raised when rendering fails due to missing or invalid variables.

    Attributes:
        missing_variables: List of variable names that were missing.
    """

    def __init__(self, message: str, missing_variables: list[str] | None = None) -> None:
        super().__init__(message)
        self.missing_variables = missing_variables or []


class PromptRenderer:
    """Renders prompt templates with variable substitution and block support.

    Supports:
    - ``{{variable}}`` — basic substitution
    - ``{{#if variable}}...{{/if}}`` — conditional blocks
    - ``{{#each array}}...{{/each}}`` — iteration blocks

    Example::

        renderer = PromptRenderer()
        result = renderer.render(
            "Hello, {{name}}! You are a {{role}}.",
            {"name": "Alice", "role": "developer"},
        )
        # → "Hello, Alice! You are a developer."
    """

    def render(
        self,
        template: str,
        variables: dict[str, Any] | None = None,
        *,
        strict: bool = True,
        required_variables: list[str] | None = None,
    ) -> str:
        """Render a prompt template with the given variables.

        Args:
            template: The prompt template string.
            variables: Key/value pairs to substitute.
            strict: If True (default), leave unknown placeholders as-is.
            required_variables: Variables that must be present; raises RendererError if missing.

        Returns:
            The rendered string.

        Raises:
            RendererError: If required variables are missing.
        """
        variables = variables or {}
        required_variables = required_variables or []

        missing = [v for v in required_variables if variables.get(v) is None]
        if missing:
            raise RendererError(
                f"Missing required variables: {', '.join(missing)}",
                missing_variables=missing,
            )

        result = template
        result = self._process_each_blocks(result, variables)
        result = self._process_if_blocks(result, variables)
        result = self._process_variables(result, variables)
        result = result.replace(r"\{{", "{{")
        return result

    def extract_variables(self, template: str) -> list[str]:
        """Extract all variable names referenced in a template.

        Args:
            template: The prompt template string.

        Returns:
            List of unique variable names.
        """
        names: set[str] = set()

        for m in re.finditer(r"\{\{([^#/][^}]*?)\}\}", template):
            names.add(m.group(1).strip())

        for m in re.finditer(r"\{\{#if\s+(\w+)\}\}", template):
            names.add(m.group(1).strip())

        for m in re.finditer(r"\{\{#each\s+(\w+)\}\}", template):
            names.add(m.group(1).strip())

        return list(names)

    def _process_each_blocks(self, template: str, variables: dict[str, Any]) -> str:
        def replace_each(match: re.Match) -> str:
            name = match.group(1)
            body = match.group(2)
            collection = variables.get(name)
            if not isinstance(collection, list):
                return ""
            parts = []
            for item in collection:
                if isinstance(item, dict):
                    parts.append(self._process_variables(body, item))
                else:
                    parts.append(body.replace("{{this}}", str(item)))
            return "".join(parts)

        return re.sub(r"\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{/each\}\}", replace_each, template)

    def _process_if_blocks(self, template: str, variables: dict[str, Any]) -> str:
        def replace_if(match: re.Match) -> str:
            name = match.group(1)
            body = match.group(2)
            value = variables.get(name)
            return body if self._is_truthy(value) else ""

        return re.sub(r"\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{/if\}\}", replace_if, template)

    def _process_variables(self, template: str, variables: dict[str, Any]) -> str:
        def replace_var(match: re.Match) -> str:
            key = match.group(1).strip()
            if key in variables:
                val = variables[key]
                if val is None:
                    return ""
                if isinstance(val, (dict, list)):
                    return json.dumps(val)
                return str(val)
            return match.group(0)

        return re.sub(r"(?<!\\)\{\{([^#/][^}]*?)\}\}", replace_var, template)

    @staticmethod
    def _is_truthy(value: Any) -> bool:
        if value is None or value is False or value == "" or value == 0:
            return False
        if isinstance(value, list) and len(value) == 0:
            return False
        return True
