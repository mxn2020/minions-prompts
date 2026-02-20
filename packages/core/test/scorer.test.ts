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

  // --- New tests ---

  it('runTestSuite with empty test id array returns empty results', async () => {
    const prompt = makePrompt('pempty', 'Hello {{name}}');
    await storage.saveMinion(prompt);

    const results = await scorer.runTestSuite('pempty', [], []);
    expect(results).toHaveLength(0);
  });

  it('runTestSuite with all tests failing returns results all with passed=false', async () => {
    const prompt = makePrompt('pfail', '{{q}}');
    const t1 = makeTest('tf1', { q: 'question one' });
    const t2 = makeTest('tf2', { q: 'question two' });
    await storage.saveMinion(prompt);
    await storage.saveMinion(t1);
    await storage.saveMinion(t2);

    const results = await scorer.runTestSuite(
      'pfail',
      ['tf1', 'tf2'],
      [
        { scores: { quality: 20 }, passed: false },
        { scores: { quality: 10 }, passed: false },
      ],
    );

    expect(results).toHaveLength(2);
    expect(results[0]!.passed).toBe(false);
    expect(results[1]!.passed).toBe(false);
  });

  it('runTest with no scores passes and scores is empty object', async () => {
    const prompt = makePrompt('pnoscore', 'Static prompt');
    const test = makeTest('tnoscore', {});
    await storage.saveMinion(prompt);
    await storage.saveMinion(test);

    const result = await scorer.runTest('pnoscore', 'tnoscore', {
      scores: {},
      passed: true,
    });

    expect(result.passed).toBe(true);
    expect(result.scores).toEqual({});
  });

  it('compareVersions with v1 winning (higher score) has winner as v1', async () => {
    const v1 = makePrompt('win1', 'Version one {{x}}');
    const v2 = makePrompt('win2', 'Version two {{x}}');
    const test = makeTest('twin', { x: 'input' });
    await storage.saveMinion(v1);
    await storage.saveMinion(v2);
    await storage.saveMinion(test);

    const comparisons = await scorer.compareVersions(
      'win1',
      'win2',
      ['twin'],
      [{ scores: { quality: 95 }, passed: true }],
      [{ scores: { quality: 50 }, passed: false }],
    );

    expect(comparisons[0]!.winner).toBe('v1');
    // v2 score - v1 score = 50 - 95 = -45
    expect(comparisons[0]!.deltas['quality']).toBe(-45);
  });

  it('runTestSuite result minions are all saved in storage', async () => {
    const prompt = makePrompt('psaved', '{{item}}');
    const t1 = makeTest('tsaved1', { item: 'apple' });
    const t2 = makeTest('tsaved2', { item: 'banana' });
    const t3 = makeTest('tsaved3', { item: 'cherry' });
    await storage.saveMinion(prompt);
    await storage.saveMinion(t1);
    await storage.saveMinion(t2);
    await storage.saveMinion(t3);

    await scorer.runTestSuite(
      'psaved',
      ['tsaved1', 'tsaved2', 'tsaved3'],
      [
        { scores: { score: 70 }, passed: true },
        { scores: { score: 80 }, passed: true },
        { scores: { score: 90 }, passed: true },
      ],
    );

    const allMinions = storage.getAllMinions();
    const resultMinions = allMinions.filter(
      (m) => m.minionTypeId === 'minions-prompts/prompt-result',
    );
    // One result minion per test
    expect(resultMinions).toHaveLength(3);
  });

  it('compareVersions with multiple test cases returns multiple comparison results', async () => {
    const v1 = makePrompt('mv1', 'Prompt A: {{topic}}');
    const v2 = makePrompt('mv2', 'Prompt B: {{topic}}');
    const t1 = makeTest('mt1', { topic: 'science' });
    const t2 = makeTest('mt2', { topic: 'history' });
    const t3 = makeTest('mt3', { topic: 'math' });
    await storage.saveMinion(v1);
    await storage.saveMinion(v2);
    await storage.saveMinion(t1);
    await storage.saveMinion(t2);
    await storage.saveMinion(t3);

    const comparisons = await scorer.compareVersions(
      'mv1',
      'mv2',
      ['mt1', 'mt2', 'mt3'],
      [
        { scores: { relevance: 60 }, passed: true },
        { scores: { relevance: 70 }, passed: true },
        { scores: { relevance: 80 }, passed: true },
      ],
      [
        { scores: { relevance: 65 }, passed: true },
        { scores: { relevance: 65 }, passed: true },
        { scores: { relevance: 85 }, passed: true },
      ],
    );

    expect(comparisons).toHaveLength(3);
    // mt1: v2 wins (65 > 60)
    expect(comparisons[0]!.winner).toBe('v2');
    // mt2: v1 wins (70 > 65)
    expect(comparisons[1]!.winner).toBe('v1');
    // mt3: v2 wins (85 > 80)
    expect(comparisons[2]!.winner).toBe('v2');
  });
});
