import { describe, it, expect, beforeEach } from 'vitest';
import type { Minion } from 'minions-sdk';
import { PromptScorer } from '../src/PromptScorer.js';
import { InMemoryStorage } from '../src/InMemoryStorage.js';

function makePrompt(id: string, content: string): Minion {
  return {
    id,
    title: 'Test Prompt',
    minionTypeId: 'minions-prompts/prompt-template',
    fields: { content },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeTest(id: string, inputVariables: Record<string, unknown>): Minion {
  return {
    id,
    title: 'Test Case',
    minionTypeId: 'minions-prompts/prompt-test',
    fields: { inputVariables },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('PromptScorer', () => {
  let storage: InMemoryStorage;
  let scorer: PromptScorer;

  beforeEach(() => {
    storage = new InMemoryStorage();
    scorer = new PromptScorer(storage);
  });

  it('runTest renders the prompt with test variables', async () => {
    const prompt = makePrompt('p1', 'Hello {{name}}');
    const test = makeTest('t1', { name: 'World' });
    await storage.saveMinion(prompt);
    await storage.saveMinion(test);

    const result = await scorer.runTest('p1', 't1', {
      scores: { relevance: 80 },
      passed: true,
    });

    expect(result.renderedPrompt).toBe('Hello World');
  });

  it('runTest returns the provided scores and pass status', async () => {
    const prompt = makePrompt('p2', 'Summarize {{topic}}');
    const test = makeTest('t2', { topic: 'AI' });
    await storage.saveMinion(prompt);
    await storage.saveMinion(test);

    const result = await scorer.runTest('p2', 't2', {
      scores: { coherence: 90, accuracy: 75 },
      passed: true,
    });

    expect(result.passed).toBe(true);
    expect(result.scores['coherence']).toBe(90);
    expect(result.scores['accuracy']).toBe(75);
  });

  it('runTest creates a prompt-result minion in storage', async () => {
    const prompt = makePrompt('p3', 'Write about {{topic}}');
    const test = makeTest('t3', { topic: 'TypeScript' });
    await storage.saveMinion(prompt);
    await storage.saveMinion(test);

    await scorer.runTest('p3', 't3', { scores: { relevance: 85 }, passed: true });

    const allMinions = storage.getAllMinions();
    const resultMinion = allMinions.find((m) => m.minionTypeId === 'minions-prompts/prompt-result');
    expect(resultMinion).toBeDefined();
    expect(resultMinion!.fields['passed']).toBe(true);
  });

  it('runTestSuite runs multiple tests and returns all results', async () => {
    const prompt = makePrompt('p4', '{{x}}');
    const t1 = makeTest('t4a', { x: 'alpha' });
    const t2 = makeTest('t4b', { x: 'beta' });
    await storage.saveMinion(prompt);
    await storage.saveMinion(t1);
    await storage.saveMinion(t2);

    const results = await scorer.runTestSuite(
      'p4',
      ['t4a', 't4b'],
      [
        { scores: { relevance: 70 }, passed: true },
        { scores: { relevance: 80 }, passed: true },
      ],
    );

    expect(results).toHaveLength(2);
    expect(results[0]!.renderedPrompt).toBe('alpha');
    expect(results[1]!.renderedPrompt).toBe('beta');
  });

  it('compareVersions determines the winner correctly', async () => {
    const v1 = makePrompt('v1', 'Version A {{x}}');
    const v2 = makePrompt('v2', 'Version B {{x}}');
    const test = makeTest('tc', { x: 'test' });
    await storage.saveMinion(v1);
    await storage.saveMinion(v2);
    await storage.saveMinion(test);

    const comparisons = await scorer.compareVersions(
      'v1',
      'v2',
      ['tc'],
      [{ scores: { accuracy: 60 }, passed: false }],
      [{ scores: { accuracy: 80 }, passed: true }],
    );

    expect(comparisons).toHaveLength(1);
    expect(comparisons[0]!.winner).toBe('v2');
    expect(comparisons[0]!.deltas['accuracy']).toBe(20);
  });

  it('compareVersions declares tie when scores are equal', async () => {
    const v1 = makePrompt('va', 'A {{x}}');
    const v2 = makePrompt('vb', 'B {{x}}');
    const test = makeTest('tb', { x: 'foo' });
    await storage.saveMinion(v1);
    await storage.saveMinion(v2);
    await storage.saveMinion(test);

    const comparisons = await scorer.compareVersions(
      'va',
      'vb',
      ['tb'],
      [{ scores: { relevance: 75 }, passed: true }],
      [{ scores: { relevance: 75 }, passed: true }],
    );

    expect(comparisons[0]!.winner).toBe('tie');
  });
});
