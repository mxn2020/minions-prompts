/**
 * @module minions-prompts/PromptScorer
 * Execute test cases against prompt versions and produce scored results.
 */

import { createMinion } from 'minions-sdk';
import type { Minion } from 'minions-sdk';
import type { PromptStorage, TestRunResult, ComparisonResult } from './types.js';
import { promptResultType } from './schemas.js';
import { PromptRenderer } from './PromptRenderer.js';

/**
 * Runs test cases against prompt versions and records scored results.
 *
 * @example
 * ```typescript
 * const scorer = new PromptScorer(storage);
 * const result = await scorer.runTest(promptId, testId, {
 *   scores: { relevance: 85, coherence: 90 },
 *   passed: true,
 * });
 * ```
 */
export class PromptScorer {
  private readonly renderer: PromptRenderer;

  constructor(private readonly storage: PromptStorage) {
    this.renderer = new PromptRenderer();
  }

  /**
   * Runs a single test case against a prompt and records the result.
   *
   * @param promptId - The ID of the prompt-template or prompt-version to test.
   * @param testId - The ID of the prompt-test minion to run.
   * @param evaluation - Scores and pass/fail provided by the caller.
   * @returns The test run result with the created prompt-result minion.
   */
  async runTest(
    promptId: string,
    testId: string,
    evaluation: {
      scores: Record<string, number>;
      passed: boolean;
      output?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<TestRunResult> {
    const [prompt, test] = await Promise.all([
      this.storage.getMinion(promptId),
      this.storage.getMinion(testId),
    ]);

    if (!prompt) throw new Error(`Prompt not found: ${promptId}`);
    if (!test) throw new Error(`Test not found: ${testId}`);

    const promptFields = prompt.fields as Record<string, unknown>;
    const testFields = test.fields as Record<string, unknown>;
    const content = (promptFields['content'] as string) ?? '';
    const inputVariables = (testFields['inputVariables'] as Record<string, unknown>) ?? {};

    const renderedPrompt = this.renderer.render(content, inputVariables, { strict: false });

    const { minion: resultMinion } = createMinion(
      {
        title: `Result: ${test.title} on ${prompt.title}`,
        fields: {
          renderedPrompt,
          output: evaluation.output,
          scores: evaluation.scores,
          metadata: evaluation.metadata,
          passed: evaluation.passed,
        },
      },
      promptResultType,
    );

    await this.storage.saveMinion(resultMinion);

    // Create relations
    const { generateId, now } = await import('minions-sdk');
    await this.storage.saveRelation({
      id: generateId(),
      sourceId: resultMinion.id,
      targetId: testId,
      type: 'references',
      createdAt: now(),
    });
    await this.storage.saveRelation({
      id: generateId(),
      sourceId: resultMinion.id,
      targetId: promptId,
      type: 'references',
      createdAt: now(),
    });

    return {
      promptId,
      testId,
      renderedPrompt,
      scores: evaluation.scores,
      passed: evaluation.passed,
      result: resultMinion,
    };
  }

  /**
   * Runs multiple test cases against a prompt.
   *
   * @param promptId - The ID of the prompt to test.
   * @param testIds - Array of test-case IDs.
   * @param evaluations - Array of evaluations in the same order as testIds.
   * @returns Array of test run results.
   */
  async runTestSuite(
    promptId: string,
    testIds: string[],
    evaluations: Array<{
      scores: Record<string, number>;
      passed: boolean;
      output?: string;
      metadata?: Record<string, unknown>;
    }>,
  ): Promise<TestRunResult[]> {
    return Promise.all(
      testIds.map((testId, i) => this.runTest(promptId, testId, evaluations[i]!)),
    );
  }

  /**
   * Runs two prompt versions against the same tests and returns side-by-side comparison.
   *
   * @param v1Id - The ID of the first (baseline) version.
   * @param v2Id - The ID of the second (comparison) version.
   * @param testIds - Array of test IDs to run against both.
   * @param v1Evaluations - Evaluations for v1.
   * @param v2Evaluations - Evaluations for v2.
   * @returns Array of comparison results.
   */
  async compareVersions(
    v1Id: string,
    v2Id: string,
    testIds: string[],
    v1Evaluations: Array<{ scores: Record<string, number>; passed: boolean }>,
    v2Evaluations: Array<{ scores: Record<string, number>; passed: boolean }>,
  ): Promise<ComparisonResult[]> {
    const [v1Results, v2Results] = await Promise.all([
      this.runTestSuite(v1Id, testIds, v1Evaluations),
      this.runTestSuite(v2Id, testIds, v2Evaluations),
    ]);

    return testIds.map((testId, i) => {
      const v1Result = v1Results[i]!;
      const v2Result = v2Results[i]!;

      const allDimensions = new Set([
        ...Object.keys(v1Result.scores),
        ...Object.keys(v2Result.scores),
      ]);

      const deltas: Record<string, number> = {};
      let totalDelta = 0;

      for (const dim of allDimensions) {
        const d1 = v1Result.scores[dim] ?? 0;
        const d2 = v2Result.scores[dim] ?? 0;
        deltas[dim] = d2 - d1;
        totalDelta += deltas[dim]!;
      }

      const winner: ComparisonResult['winner'] =
        totalDelta > 0 ? 'v2' : totalDelta < 0 ? 'v1' : 'tie';

      return { v1Id, v2Id, testId, v1Result, v2Result, deltas, winner };
    });
  }
}
