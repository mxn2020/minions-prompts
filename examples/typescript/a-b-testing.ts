/**
 * A/B Testing Example
 * Compare two prompt versions with scored test cases.
 */

import { createMinion, generateId, now } from 'minions-sdk';
import {
  promptTemplateType,
  promptVersionType,
  promptTestType,
  PromptScorer,
  InMemoryStorage,
} from '../../packages/core/src/index.js';

async function main() {
  const storage = new InMemoryStorage();

  // Prompt v1: concise instructions
  const { minion: v1 } = createMinion(
    {
      title: 'Explainer v1',
      fields: {
        content: 'Explain {{concept}} simply.',
        variables: ['concept'],
      },
    },
    promptTemplateType,
  );
  await storage.saveMinion(v1);

  // Prompt v2: detailed instructions
  const { minion: v2 } = createMinion(
    {
      title: 'Explainer v2',
      fields: {
        content: `Explain {{concept}} to a {{audience}} in 3-4 sentences.
Use an analogy if helpful. Avoid jargon.`,
        versionNumber: 2,
        changelog: 'Added audience targeting and style guidance',
        variables: ['concept', 'audience'],
      },
    },
    promptVersionType,
  );
  await storage.saveMinion(v2);
  await storage.saveRelation({
    id: generateId(),
    sourceId: v2.id,
    targetId: v1.id,
    type: 'follows',
    createdAt: now(),
  });

  // Create test cases
  const testCases = [
    {
      title: 'Explain neural networks',
      inputVariables: { concept: 'neural networks', audience: 'high school students' },
    },
    {
      title: 'Explain blockchain',
      inputVariables: { concept: 'blockchain', audience: 'non-technical managers' },
    },
    {
      title: 'Explain recursion',
      inputVariables: { concept: 'recursion', audience: 'junior developers' },
    },
  ];

  const testMinions = [];
  for (const tc of testCases) {
    const { minion: test } = createMinion(
      {
        title: tc.title,
        fields: {
          inputVariables: tc.inputVariables,
          scoringDimensions: ['clarity', 'accuracy', 'conciseness'],
        },
      },
      promptTestType,
    );
    await storage.saveMinion(test);
    testMinions.push(test);
  }

  const scorer = new PromptScorer(storage);

  // Simulated scores (in production: use an LLM judge or human evaluators)
  const v1Scores = [
    { scores: { clarity: 60, accuracy: 80, conciseness: 85 }, passed: true },
    { scores: { clarity: 58, accuracy: 75, conciseness: 90 }, passed: true },
    { scores: { clarity: 70, accuracy: 85, conciseness: 88 }, passed: true },
  ];

  const v2Scores = [
    { scores: { clarity: 88, accuracy: 82, conciseness: 72 }, passed: true },
    { scores: { clarity: 85, accuracy: 78, conciseness: 70 }, passed: true },
    { scores: { clarity: 90, accuracy: 87, conciseness: 68 }, passed: true },
  ];

  const comparisons = await scorer.compareVersions(
    v1.id,
    v2.id,
    testMinions.map((t) => t.id),
    v1Scores,
    v2Scores,
  );

  console.log('\n📊 A/B Comparison Results\n');
  console.log('═'.repeat(60));

  for (let i = 0; i < comparisons.length; i++) {
    const cmp = comparisons[i]!;
    const tc = testCases[i]!;
    console.log(`\nTest: ${tc.title}`);
    console.log(`Winner: ${cmp.winner === 'v2' ? '✅ v2' : cmp.winner === 'v1' ? '◀ v1' : '🤝 Tie'}`);
    console.log('Score deltas (positive = v2 wins):');
    for (const [dim, delta] of Object.entries(cmp.deltas)) {
      const sign = delta > 0 ? '+' : '';
      console.log(`  ${dim}: ${sign}${delta}`);
    }
  }

  // Summary
  const v2Wins = comparisons.filter((c) => c.winner === 'v2').length;
  console.log('\n' + '═'.repeat(60));
  console.log(`\nOverall: v2 won ${v2Wins}/${comparisons.length} tests`);
  console.log(
    'Recommendation: v2 is significantly better on clarity but trades off conciseness.',
    '\nChoose v2 if clarity is your primary concern.',
  );
}

main().catch(console.error);
