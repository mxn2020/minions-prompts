/**
 * prompts diff <v1-id> <v2-id>
 * Show colored diff between two versions.
 */

import { PromptDiff } from '@minions-prompts/sdk';
import chalk from 'chalk';
import type { FileStorage } from '../storage.js';

export async function diffCommand(
  v1Id: string,
  v2Id: string,
  storage: FileStorage,
  options: { json?: boolean },
): Promise<void> {
  const [v1, v2] = await Promise.all([storage.getMinion(v1Id), storage.getMinion(v2Id)]);

  if (!v1) { console.error(chalk.red(`Not found: ${v1Id}`)); process.exit(1); }
  if (!v2) { console.error(chalk.red(`Not found: ${v2Id}`)); process.exit(1); }

  const differ = new PromptDiff();
  const result = differ.diff(v1, v2);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(chalk.bold(`\n🔍  Diff: ${v1.title}  →  ${v2.title}\n`));
  const formatted = differ.format(result, true);
  if (formatted.trim()) {
    console.log(formatted);
  } else {
    console.log(chalk.dim('No differences found.'));
  }
}
