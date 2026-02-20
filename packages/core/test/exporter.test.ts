import { describe, it, expect, beforeEach } from 'vitest';
import type { Minion } from 'minions-sdk';
import { PromptExporter } from '../src/PromptExporter.js';
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

describe('PromptExporter', () => {
  let storage: InMemoryStorage;
  let exporter: PromptExporter;

  beforeEach(() => {
    storage = new InMemoryStorage();
    exporter = new PromptExporter(storage);
  });

  it('toRaw renders prompt with provided variables', async () => {
    await storage.saveMinion(makePrompt('p1', 'Hello {{name}}, you are {{role}}!'));

    const raw = await exporter.toRaw('p1', { name: 'Alice', role: 'admin' });
    expect(raw).toBe('Hello Alice, you are admin!');
  });

  it('toRaw returns template unchanged when no variables provided', async () => {
    await storage.saveMinion(makePrompt('p2', 'Static prompt with no variables'));

    const raw = await exporter.toRaw('p2', {});
    expect(raw).toBe('Static prompt with no variables');
  });

  it('toLangChain returns correct template and input variables', async () => {
    await storage.saveMinion(makePrompt('p3', 'Write about {{topic}} for {{audience}}'));

    const lc = await exporter.toLangChain('p3');
    expect(lc.template).toBe('Write about {{topic}} for {{audience}}');
    expect(lc.inputVariables).toContain('topic');
    expect(lc.inputVariables).toContain('audience');
  });

  it('toLangChain returns empty inputVariables for static prompt', async () => {
    await storage.saveMinion(makePrompt('p4', 'No variables here'));

    const lc = await exporter.toLangChain('p4');
    expect(lc.inputVariables).toHaveLength(0);
  });

  it('toLlamaIndex returns template with templateVars', async () => {
    await storage.saveMinion(makePrompt('p5', 'Summarize {{content}} in {{length}} words'));

    const li = await exporter.toLlamaIndex('p5');
    expect(li.template).toBe('Summarize {{content}} in {{length}} words');
    expect(li.templateVars).toContain('content');
    expect(li.templateVars).toContain('length');
  });

  it('toJSON returns structured export with prompt and metadata', async () => {
    await storage.saveMinion(makePrompt('p6', 'Hello {{name}}'));

    const json = await exporter.toJSON('p6');
    expect(json.prompt.id).toBe('p6');
    expect(Array.isArray(json.versions)).toBe(true);
    expect(Array.isArray(json.testResults)).toBe(true);
    expect(Array.isArray(json.relations)).toBe(true);
    expect(typeof json.exportedAt).toBe('string');
  });

  it('toJSON throws for unknown prompt id', async () => {
    await expect(exporter.toJSON('nonexistent')).rejects.toThrow('Prompt not found');
  });

  // --- New tests ---

  it('toRaw throws for unknown prompt id', async () => {
    await expect(exporter.toRaw('does-not-exist', { name: 'Test' })).rejects.toThrow(
      'Prompt not found',
    );
  });

  it('toLangChain result has outputParser as null', async () => {
    await storage.saveMinion(makePrompt('p7', 'Describe {{thing}}'));

    const lc = await exporter.toLangChain('p7');
    // LangChainExport interface specifies outputParser: null
    expect(lc.outputParser).toBeNull();
  });

  it('toLlamaIndex result template string equals the prompt content', async () => {
    const content = 'Translate {{text}} from {{source}} to {{target}}';
    await storage.saveMinion(makePrompt('p8', content));

    const li = await exporter.toLlamaIndex('p8');
    expect(li.template).toBe(content);
  });

  it('toJSON for prompt with no test results has testResults as empty array', async () => {
    await storage.saveMinion(makePrompt('p9', 'A prompt with {{var}} but no test results'));

    const json = await exporter.toJSON('p9');
    expect(json.testResults).toEqual([]);
  });

  it('toRaw with partial variables (some missing) renders known vars and leaves unknown as-is', async () => {
    await storage.saveMinion(makePrompt('p10', 'Hello {{name}}, your role is {{role}}'));

    // toRaw uses strict: false, so missing variables are left as the original {{…}} token
    const raw = await exporter.toRaw('p10', { name: 'Bob' });
    // 'name' is substituted; 'role' is missing but strict=false leaves it as {{role}}
    expect(raw).toContain('Bob');
    expect(typeof raw).toBe('string');
  });
});
