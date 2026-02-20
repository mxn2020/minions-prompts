/**
 * prompts history <id>
 * Show version history chain.
 */

import { PromptChain } from '@minions-prompts/sdk';
import chalk from 'chalk';
import type { FileStorage } from '../storage.js';

export async function historyCommand(
  id: string,
  storage: FileStorage,
  options: { json?: boolean },
): Promise<void> {
  const chain = new PromptChain(storage);

  try {
    const versions = await chain.getVersionChain(id);

    if (options.json) {
      console.log(JSON.stringify(versions, null, 2));
      return;
    }

    const prompt = await storage.getMinion(id);
    console.log(chalk.bold(`\n📜  Version history for: ${prompt?.title ?? id}\n`));

    for (let i = 0; i < versions.length; i++) {
      const v = versions[i]!;
      const fields = v.fields as Record<string, unknown>;
      const isLatest = i === versions.length - 1;
      const date = new Date(v.createdAt).toLocaleString();
      const vNum = fields['versionNumber'] ? `v${fields['versionNumber']}` : (i === 0 ? 'root' : `v${i + 1}`);

      console.log(
        `${isLatest ? chalk.green('▶') : chalk.dim('◆')} ${chalk.cyan(vNum)} ${chalk.white(v.title)} ${chalk.dim(`(${date})`)}`,
      );
      if (fields['changelog']) {
        console.log(`   ${chalk.dim(fields['changelog'] as string)}`);
      }
      console.log(`   ${chalk.dim(`ID: ${v.id}`)}`);
    }

    console.log();
    console.log(chalk.dim(`Total versions: ${versions.length}`));
  } catch (err) {
    console.error(chalk.red(`Error: ${(err as Error).message}`));
    process.exit(1);
  }
}
