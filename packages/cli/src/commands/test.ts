/**
 * prompts test <id> --against <test-id>
 * Run a test case against a prompt.
 */

import { PromptScorer } from 'minions-prompts';
import chalk from 'chalk';
import type { FileStorage } from '../storage.js';

export async function testCommand(
  id: string,
  storage: FileStorage,
  options: { against: string; json?: boolean },
): Promise<void> {
  const prompt = await storage.getMinion(id);
  const test = await storage.getMinion(options.against);

  if (!prompt) { console.error(chalk.red(`Prompt not found: ${id}`)); process.exit(1); }
  if (!test) { console.error(chalk.red(`Test not found: ${options.against}`)); process.exit(1); }

  const { default: inquirer } = await import('inquirer');

  console.log(chalk.bold('\n🧪  Running test\n'));
  console.log(`   Prompt: ${chalk.cyan(prompt.title)} (${id})`);
  console.log(`   Test: ${chalk.cyan(test.title)} (${options.against})`);

  const testFields = test.fields as Record<string, unknown>;
  const inputVariables = (testFields['inputVariables'] as Record<string, unknown>) ?? {};
  const scoringDimensions = (testFields['scoringDimensions'] as string[]) ?? ['relevance', 'coherence'];

  console.log('\n   Input variables:');
  for (const [k, v] of Object.entries(inputVariables)) {
    console.log(`     ${chalk.yellow(k)}: ${chalk.white(String(v))}`);
  }

  // Ask for scores
  const scoreQuestions = scoringDimensions.map((dim) => ({
    type: 'number',
    name: dim,
    message: `Score for ${dim} (0-100):`,
    default: 75,
    validate: (v: number) => (v >= 0 && v <= 100) || 'Score must be 0-100',
  }));

  const passedAnswer = await inquirer.prompt([
    ...scoreQuestions,
    {
      type: 'confirm',
      name: 'passed',
      message: 'Did this test pass?',
      default: true,
    },
  ]);

  const scores: Record<string, number> = {};
  for (const dim of scoringDimensions) {
    scores[dim] = Number(passedAnswer[dim]);
  }

  const scorer = new PromptScorer(storage);
  const result = await scorer.runTest(id, options.against, {
    scores,
    passed: passedAnswer.passed as boolean,
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(chalk.bold('\n📊  Result\n'));
  console.log(`   Result ID: ${chalk.cyan(result.result.id)}`);
  console.log(`   Status: ${result.passed ? chalk.green('✅ PASSED') : chalk.red('❌ FAILED')}`);
  console.log('   Scores:');
  for (const [dim, score] of Object.entries(result.scores)) {
    const color = score >= 75 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red;
    console.log(`     ${chalk.white(dim)}: ${color(String(score))}`);
  }

  process.exit(result.passed ? 0 : 1);
}
