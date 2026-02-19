/**
 * prompts new <title>
 * Interactively create a new prompt template.
 */

import { createMinion, generateId, now } from 'minions-sdk';
import { promptTemplateType } from 'minions-prompts';
import chalk from 'chalk';
import type { FileStorage } from '../storage.js';

export async function newCommand(title: string, storage: FileStorage): Promise<void> {
  // Dynamic import to avoid require() issues
  const { default: inquirer } = await import('inquirer');

  console.log(chalk.bold('\n🆕  Creating new prompt template\n'));

  const answers = await inquirer.prompt([
    {
      type: 'editor',
      name: 'content',
      message: 'Prompt content (use {{variable}} for placeholders):',
      default: `You are a helpful assistant.\n\nTask: {{task}}\n\nContext: {{context}}`,
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description (optional):',
    },
    {
      type: 'input',
      name: 'variables',
      message: 'Variable names (comma-separated, e.g. topic,audience):',
    },
    {
      type: 'input',
      name: 'tags',
      message: 'Tags (comma-separated, optional):',
    },
  ]);

  const variables = answers.variables
    ? (answers.variables as string).split(',').map((v: string) => v.trim()).filter(Boolean)
    : [];
  const tags = answers.tags
    ? (answers.tags as string).split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];

  const { minion, validation } = createMinion(
    {
      title,
      description: answers.description || undefined,
      fields: {
        content: answers.content,
        description: answers.description || undefined,
        variables,
        tags,
      },
    },
    promptTemplateType,
  );

  if (!validation.valid) {
    console.error(chalk.red('Validation failed:'));
    for (const err of validation.errors) {
      console.error(chalk.red(`  - ${err.field}: ${err.message}`));
    }
    process.exit(1);
  }

  await storage.saveMinion(minion);

  console.log(chalk.green('\n✅  Prompt created successfully!'));
  console.log(`   ID: ${chalk.cyan(minion.id)}`);
  console.log(`   Title: ${chalk.white(title)}`);
  if (variables.length > 0) {
    console.log(`   Variables: ${chalk.yellow(variables.join(', '))}`);
  }
}
