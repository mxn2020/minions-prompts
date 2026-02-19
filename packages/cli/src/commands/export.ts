/**
 * prompts export <id> --format <langchain|llamaindex|raw|json>
 * Export a prompt to various formats.
 */

import { PromptExporter } from 'minions-prompts';
import chalk from 'chalk';
import { writeFileSync } from 'node:fs';
import type { FileStorage } from '../storage.js';

export async function exportCommand(
  id: string,
  storage: FileStorage,
  options: { format: string; output?: string; vars?: string[] },
): Promise<void> {
  const exporter = new PromptExporter(storage);

  let variables: Record<string, unknown> = {};
  if (options.vars) {
    for (const pair of options.vars) {
      const eqIdx = pair.indexOf('=');
      if (eqIdx !== -1) {
        variables[pair.slice(0, eqIdx)] = pair.slice(eqIdx + 1);
      }
    }
  }

  let output: string;

  try {
    switch (options.format) {
      case 'langchain': {
        const result = await exporter.toLangChain(id);
        output = JSON.stringify(result, null, 2);
        break;
      }
      case 'llamaindex': {
        const result = await exporter.toLlamaIndex(id);
        output = JSON.stringify(result, null, 2);
        break;
      }
      case 'json': {
        const result = await exporter.toJSON(id);
        output = JSON.stringify(result, null, 2);
        break;
      }
      case 'raw': {
        output = await exporter.toRaw(id, variables);
        break;
      }
      default:
        console.error(chalk.red(`Unknown format: ${options.format}. Use: langchain, llamaindex, raw, json`));
        process.exit(1);
    }

    if (options.output) {
      writeFileSync(options.output, output, 'utf-8');
      console.log(chalk.green(`✅  Exported to ${options.output}`));
    } else {
      console.log(output);
    }
  } catch (err) {
    console.error(chalk.red(`Export error: ${(err as Error).message}`));
    process.exit(1);
  }
}
