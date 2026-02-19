"""
PromptScorer — execute test cases against prompt versions and produce scored results.
"""

from __future__ import annotations

from typing import Any

from minions import Minion, create_minion, generate_id, now, Relation

from .storage import PromptStorage
from .schemas import prompt_result_type
from .prompt_renderer import PromptRenderer
from .types import TestRunResult, ComparisonResult


class PromptScorer:
    """Runs test cases against prompt versions and records scored results.

    Args:
        storage: The storage backend to use.

    Example::

        scorer = PromptScorer(storage)
        result = scorer.run_test(
            prompt_id,
            test_id,
            scores={"relevance": 85, "coherence": 90},
            passed=True,
        )
    """

    def __init__(self, storage: PromptStorage) -> None:
        self._storage = storage
        self._renderer = PromptRenderer()

    def run_test(
        self,
        prompt_id: str,
        test_id: str,
        *,
        scores: dict[str, float],
        passed: bool,
        output: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> TestRunResult:
        """Run a single test case against a prompt and record the result.

        Args:
            prompt_id: The ID of the prompt-template or prompt-version.
            test_id: The ID of the prompt-test minion.
            scores: Map of dimension names to scores (0–100).
            passed: Whether the test passes.
            output: Actual LLM output (if captured).
            metadata: Extra metadata (model, temperature, tokens, etc.).

        Returns:
            A TestRunResult with the created prompt-result minion.
        """
        prompt = self._storage.get_minion(prompt_id)
        test = self._storage.get_minion(test_id)
        if not prompt:
            raise ValueError(f"Prompt not found: {prompt_id}")
        if not test:
            raise ValueError(f"Test not found: {test_id}")

        content = (prompt.fields or {}).get("content", "") or ""
        input_variables = (test.fields or {}).get("inputVariables", {}) or {}

        rendered_prompt = self._renderer.render(str(content), dict(input_variables), strict=False)

        result_minion, _ = create_minion(
            {
                "title": f"Result: {test.title} on {prompt.title}",
                "fields": {
                    "renderedPrompt": rendered_prompt,
                    "output": output,
                    "scores": scores,
                    "metadata": metadata,
                    "passed": passed,
                },
            },
            prompt_result_type,
        )
        self._storage.save_minion(result_minion)

        # Create references
        for target_id in [test_id, prompt_id]:
            rel = Relation(
                id=generate_id(),
                source_id=result_minion.id,
                target_id=target_id,
                type="references",
                created_at=now(),
            )
            self._storage.save_relation(rel)

        return TestRunResult(
            prompt_id=prompt_id,
            test_id=test_id,
            rendered_prompt=rendered_prompt,
            scores=scores,
            passed=passed,
            result=result_minion,
        )

    def run_test_suite(
        self,
        prompt_id: str,
        test_ids: list[str],
        evaluations: list[dict[str, Any]],
    ) -> list[TestRunResult]:
        """Run multiple test cases against a prompt.

        Args:
            prompt_id: The ID of the prompt to test.
            test_ids: List of test-case IDs.
            evaluations: List of evaluation dicts with ``scores`` and ``passed`` keys.

        Returns:
            List of TestRunResult objects.
        """
        results = []
        for test_id, evaluation in zip(test_ids, evaluations):
            results.append(
                self.run_test(
                    prompt_id,
                    test_id,
                    scores=evaluation.get("scores", {}),
                    passed=evaluation.get("passed", False),
                    output=evaluation.get("output"),
                    metadata=evaluation.get("metadata"),
                )
            )
        return results

    def compare_versions(
        self,
        v1_id: str,
        v2_id: str,
        test_ids: list[str],
        v1_evaluations: list[dict[str, Any]],
        v2_evaluations: list[dict[str, Any]],
    ) -> list[ComparisonResult]:
        """Run A/B comparison between two versions against the same tests.

        Args:
            v1_id: ID of the baseline version.
            v2_id: ID of the comparison version.
            test_ids: List of test IDs to run against both.
            v1_evaluations: Evaluations for v1.
            v2_evaluations: Evaluations for v2.

        Returns:
            List of ComparisonResult objects.
        """
        v1_results = self.run_test_suite(v1_id, test_ids, v1_evaluations)
        v2_results = self.run_test_suite(v2_id, test_ids, v2_evaluations)

        comparisons = []
        for i, test_id in enumerate(test_ids):
            v1_result = v1_results[i]
            v2_result = v2_results[i]

            all_dims = set(v1_result.scores) | set(v2_result.scores)
            deltas = {
                dim: v2_result.scores.get(dim, 0) - v1_result.scores.get(dim, 0)
                for dim in all_dims
            }
            total_delta = sum(deltas.values())
            winner = "v2" if total_delta > 0 else "v1" if total_delta < 0 else "tie"

            comparisons.append(
                ComparisonResult(
                    v1_id=v1_id,
                    v2_id=v2_id,
                    test_id=test_id,
                    v1_result=v1_result,
                    v2_result=v2_result,
                    deltas=deltas,
                    winner=winner,
                )
            )
        return comparisons
