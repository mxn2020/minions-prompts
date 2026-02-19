#!/usr/bin/env node
/**
 * prompts — CLI for minions-prompts
 * Version-controlled prompt engineering from the command line.
 */

import { Command } from 'commander';
import { FileStorage } from './storage.js';
import { newCommand } from './commands/new.js';
import { versionBumpCommand } from './commands/version.js';
import { diffCommand } from './commands/diff.js';
import { renderCommand } from './commands/render.js';
import { historyCommand } from './commands/history.js';
import { exportCommand } from './commands/export.js';
import { testCommand } from './commands/test.js';

const program = new Command();
const storage = new FileStorage();

program
  .name('prompts')
  .description('Version-controlled prompt engineering CLI')
  .version('0.1.0');

// prompts new <title>
program
  .command('new <title>')
  .description('Interactively create a new prompt template')
  .action((title: string) => newCommand(title, storage));

// prompts version bump <id>
const versionCmd = program.command('version').description('Version management commands');
versionCmd
  .command('bump <id>')
  .description('Create a new version of an existing prompt')
  .option('--content <content>', 'Prompt content (skips interactive editor)')
  .action((id: string, opts: { content?: string }) => versionBumpCommand(id, storage, opts));

// prompts diff <v1-id> <v2-id>
program
  .command('diff <v1Id> <v2Id>')
  .description('Show colored diff between two versions')
  .option('--json', 'Output as JSON')
  .action((v1Id: string, v2Id: string, opts: { json?: boolean }) =>
    diffCommand(v1Id, v2Id, storage, opts)
  );

// prompts render <id>
program
  .command('render <id>')
  .description('Render a prompt with variable substitution')
  .option('--vars <vars...>', 'Variable values as key=value pairs')
  .option('--vars-file <file>', 'JSON file with variable values')
  .action((id: string, opts: { vars?: string[]; varsFile?: string }) =>
    renderCommand(id, storage, opts)
  );

// prompts history <id>
program
  .command('history <id>')
  .description('Show full version history chain')
  .option('--json', 'Output as JSON')
  .action((id: string, opts: { json?: boolean }) => historyCommand(id, storage, opts));

// prompts export <id>
program
  .command('export <id>')
  .description('Export to various formats')
  .requiredOption('--format <format>', 'Export format: langchain, llamaindex, raw, json')
  .option('--output <file>', 'Output file path (default: stdout)')
  .option('--vars <vars...>', 'Variable values for raw format')
  .action((id: string, opts: { format: string; output?: string; vars?: string[] }) =>
    exportCommand(id, storage, opts)
  );

// prompts test <id>
program
  .command('test <id>')
  .description('Run a test case against a prompt')
  .requiredOption('--against <testId>', 'Test case ID to run')
  .option('--json', 'Output as JSON')
  .action((id: string, opts: { against: string; json?: boolean }) =>
    testCommand(id, storage, opts)
  );

program.parse();
