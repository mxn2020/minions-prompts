"""
PromptDiff — field-level and line-level diff between two prompt versions.
"""

from __future__ import annotations

import json
from minions import Minion
from .types import DiffResult, DiffLine


class PromptDiff:
    """Computes structured diffs between two prompt minions.

    Example::

        differ = PromptDiff()
        result = differ.diff(v1, v2)
        print(differ.format(result, colored=True))
    """

    def diff(self, v1: Minion, v2: Minion) -> DiffResult:
        """Compute the difference between two prompt minions.

        Args:
            v1: The older (baseline) minion.
            v2: The newer (comparison) minion.

        Returns:
            A structured DiffResult.
        """
        f1 = v1.fields or {}
        f2 = v2.fields or {}

        all_keys = set(f1.keys()) | set(f2.keys())

        added = []
        removed = []
        changed = []

        for key in all_keys:
            in_v1 = key in f1
            in_v2 = key in f2
            if not in_v1 and in_v2:
                added.append({"field": key, "value": f2[key]})
            elif in_v1 and not in_v2:
                removed.append({"field": key, "value": f1[key]})
            elif in_v1 and in_v2 and f1[key] != f2[key]:
                changed.append({"field": key, "from": f1[key], "to": f2[key]})

        if v1.title != v2.title:
            changed.append({"field": "title", "from": v1.title, "to": v2.title})

        content1 = f1.get("content", "") or ""
        content2 = f2.get("content", "") or ""
        content_diff = self._line_diff(str(content1), str(content2))

        return DiffResult(added=added, removed=removed, changed=changed, content_diff=content_diff)

    def format(self, result: DiffResult, *, colored: bool = False) -> str:
        """Format a DiffResult as a human-readable string.

        Args:
            result: The diff result to format.
            colored: Whether to include ANSI color codes.

        Returns:
            Formatted string.
        """
        GREEN = "\033[32m" if colored else ""
        RED = "\033[31m" if colored else ""
        YELLOW = "\033[33m" if colored else ""
        RESET = "\033[0m" if colored else ""

        lines = []
        for item in result.added:
            lines.append(f"{GREEN}+ [{item['field']}] {json.dumps(item['value'])}{RESET}")
        for item in result.removed:
            lines.append(f"{RED}- [{item['field']}] {json.dumps(item['value'])}{RESET}")
        for item in result.changed:
            if item["field"] == "content":
                continue
            lines.append(f"{YELLOW}~ [{item['field']}] {json.dumps(item['from'])} → {json.dumps(item['to'])}{RESET}")

        if result.content_diff:
            lines.append("--- content ---")
            for line in result.content_diff:
                if line.type == "add":
                    lines.append(f"{GREEN}+ {line.text}{RESET}")
                elif line.type == "remove":
                    lines.append(f"{RED}- {line.text}{RESET}")
                else:
                    lines.append(f"  {line.text}")

        return "\n".join(lines)

    def _line_diff(self, text1: str, text2: str) -> list[DiffLine]:
        lines1 = text1.split("\n")
        lines2 = text2.split("\n")
        lcs = self._compute_lcs(lines1, lines2)

        result: list[DiffLine] = []
        i = j = k = 0
        while i < len(lines1) or j < len(lines2):
            if (
                i < len(lines1)
                and j < len(lines2)
                and k < len(lcs)
                and lines1[i] == lcs[k]
                and lines2[j] == lcs[k]
            ):
                result.append(DiffLine(type="context", text=lines1[i]))
                i += 1
                j += 1
                k += 1
            elif j < len(lines2) and (k >= len(lcs) or lines2[j] != lcs[k]):
                result.append(DiffLine(type="add", text=lines2[j]))
                j += 1
            elif i < len(lines1):
                result.append(DiffLine(type="remove", text=lines1[i]))
                i += 1

        return result

    def _compute_lcs(self, a: list[str], b: list[str]) -> list[str]:
        m, n = len(a), len(b)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if a[i - 1] == b[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1
                else:
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

        lcs: list[str] = []
        i, j = m, n
        while i > 0 and j > 0:
            if a[i - 1] == b[j - 1]:
                lcs.append(a[i - 1])
                i -= 1
                j -= 1
            elif dp[i - 1][j] > dp[i][j - 1]:
                i -= 1
            else:
                j -= 1

        lcs.reverse()
        return lcs
