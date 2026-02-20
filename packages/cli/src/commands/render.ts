/**
 * prompts render <id> --vars key=value
 * Render a prompt with variable substitution.
 */

import { PromptRenderer } from '@minions-prompts/sdk';
import chalk from 'chalk';
import { readFileSync } from 'node:fs';
import type { FileStorage } from '../storage.js';

export async function renderCommand(
  id: string,
  storage: FileStorage,
  options: { vars?: string[]; varsFile?: string },
): Promise<void> {
  const prompt = await storage.getMinion(id);
  if (!prompt) {
    console.error(chalk.red(`Prompt not found: ${id}`));
    process.exit(1);
  }

  let variables: Record<string, unknown> = {};

  if (options.varsFile) {
    try {
      variables = JSON.parse(readFileSync(options.varsFile, 'utf-8'));
    } catch {
      console.error(chalk.red(`Could not read vars file: ${options.varsFile}`));
      process.exit(1);
    }
  }

  if (options.vars) {
    for (const pair of options.vars) {
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) {
        console.error(chalk.red(`Invalid var format (expected key=value): ${pair}`));
        process.exit(1);
      }
      const key = pair.slice(0, eqIdx);
      const val = pair.slice(eqIdx + 1);
      variables[key] = val;
    }
  }

  const renderer = new PromptRenderer();
  const content = (prompt.fields as Record<string, unknown>)['content'] as string ?? '';

  try {
    const rendered = renderer.render(content, variables, { strict: false });
    console.log(rendered);
  } catch (err) {
    console.error(chalk.red(`Render error: ${(err as Error).message}`));
    process.exit(1);
  }
}
