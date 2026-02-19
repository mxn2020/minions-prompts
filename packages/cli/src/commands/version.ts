/**
 * prompts version bump <id>
 * Create a new version of an existing prompt.
 */

import { createMinion, generateId, now } from 'minions-sdk';
import { promptVersionType } from 'minions-prompts';
import chalk from 'chalk';
import type { FileStorage } from '../storage.js';

export async function versionBumpCommand(id: string, storage: FileStorage, options: { content?: string }): Promise<void> {
  const existing = await storage.getMinion(id);
  if (!existing) {
    console.error(chalk.red(`Prompt not found: ${id}`));
    process.exit(1);
  }

  const existingFields = existing.fields as Record<string, unknown>;

  let newContent: string;
  let changelog: string;

  if (options.content) {
    newContent = options.content;
    changelog = 'Updated via --content flag';
  } else {
    const { default: inquirer } = await import('inquirer');
    console.log(chalk.bold('\n🔖  Creating new version\n'));
    console.log(chalk.dim('Current content:'));
    console.log(chalk.white((existingFields['content'] as string) ?? ''));
    console.log();

    const answers = await inquirer.prompt([
      {
        type: 'editor',
        name: 'content',
        message: 'New prompt content:',
        default: existingFields['content'] as string,
      },
      {
        type: 'input',
        name: 'changelog',
        message: 'Changelog (what changed?):',
        validate: (v: string) => v.trim().length > 0 || 'Changelog is required',
      },
    ]);
    newContent = answers.content;
    changelog = answers.changelog;
  }

  // Determine version number
  const followsRels = await storage.getRelations({ targetId: id, type: 'follows' });
  const versionNumber = followsRels.length + 2; // +1 for base, +1 for new

  const { minion: versionMinion, validation } = createMinion(
    {
      title: `${existing.title} v${versionNumber}`,
      fields: {
        content: newContent,
        description: existingFields['description'],
        versionNumber,
        changelog,
        variables: existingFields['variables'],
        tags: existingFields['tags'],
      },
    },
    promptVersionType,
  );

  if (!validation.valid) {
    console.error(chalk.red('Validation failed:'));
    for (const err of validation.errors) {
      console.error(chalk.red(`  - ${err.field}: ${err.message}`));
    }
    process.exit(1);
  }

  await storage.saveMinion(versionMinion);

  // Link with follows relation
  await storage.saveRelation({
    id: generateId(),
    sourceId: versionMinion.id,
    targetId: id,
    type: 'follows',
    createdAt: now(),
  });

  console.log(chalk.green('\n✅  New version created!'));
  console.log(`   ID: ${chalk.cyan(versionMinion.id)}`);
  console.log(`   Version: ${chalk.white(`v${versionNumber}`)}`);
  console.log(`   Changelog: ${chalk.dim(changelog)}`);
}
