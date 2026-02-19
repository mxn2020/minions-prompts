/**
 * @module minions-prompts/PromptExporter
 * Export prompt templates to various external formats.
 */

import type { Minion, Relation } from 'minions-sdk';
import type {
  PromptStorage,
  LangChainExport,
  LlamaIndexExport,
  FullJsonExport,
} from './types.js';
import { PromptRenderer } from './PromptRenderer.js';
import { PromptChain } from './PromptChain.js';

/**
 * Exports prompt templates to external formats.
 *
 * @example
 * ```typescript
 * const exporter = new PromptExporter(storage);
 * const langchain = await exporter.toLangChain(promptId);
 * const raw = await exporter.toRaw(promptId, { topic: 'AI' });
 * ```
 */
export class PromptExporter {
  private readonly renderer: PromptRenderer;
  private readonly chain: PromptChain;

  constructor(private readonly storage: PromptStorage) {
    this.renderer = new PromptRenderer();
    this.chain = new PromptChain(storage);
  }

  /**
   * Renders the prompt as a plain string with variables substituted.
   *
   * @param promptId - The prompt to render.
   * @param variables - Variable values to substitute.
   * @returns The rendered prompt string.
   */
  async toRaw(promptId: string, variables: Record<string, unknown> = {}): Promise<string> {
    const prompt = await this.storage.getMinion(promptId);
    if (!prompt) throw new Error(`Prompt not found: ${promptId}`);
    const content = (prompt.fields as Record<string, unknown>)['content'] as string ?? '';
    return this.renderer.render(content, variables, { strict: false });
  }

  /**
   * Exports to LangChain PromptTemplate format.
   *
   * @param promptId - The prompt to export.
   * @returns LangChain-compatible export object.
   */
  async toLangChain(promptId: string): Promise<LangChainExport> {
    const prompt = await this.storage.getMinion(promptId);
    if (!prompt) throw new Error(`Prompt not found: ${promptId}`);
    const fields = prompt.fields as Record<string, unknown>;
    const content = (fields['content'] as string) ?? '';
    const inputVariables = this.renderer.extractVariables(content);

    return {
      template: content,
      inputVariables,
      outputParser: null,
    };
  }

  /**
   * Exports to LlamaIndex PromptTemplate format.
   *
   * @param promptId - The prompt to export.
   * @returns LlamaIndex-compatible export object.
   */
  async toLlamaIndex(promptId: string): Promise<LlamaIndexExport> {
    const prompt = await this.storage.getMinion(promptId);
    if (!prompt) throw new Error(`Prompt not found: ${promptId}`);
    const fields = prompt.fields as Record<string, unknown>;
    const content = (fields['content'] as string) ?? '';
    const templateVars = this.renderer.extractVariables(content);

    return {
      template: content,
      templateVars,
    };
  }

  /**
   * Exports to full JSON including version history and test results.
   *
   * @param promptId - The prompt to export.
   * @returns Full structured JSON export.
   */
  async toJSON(promptId: string): Promise<FullJsonExport> {
    const prompt = await this.storage.getMinion(promptId);
    if (!prompt) throw new Error(`Prompt not found: ${promptId}`);

    let versions: Minion[] = [];
    try {
      versions = await this.chain.getVersionChain(promptId);
    } catch {
      versions = [prompt];
    }

    // Collect all test result relations
    const allRelations: Relation[] = [];
    const testResults: Minion[] = [];

    for (const version of versions) {
      const refs = await this.storage.getRelations({
        targetId: version.id,
        type: 'references',
      });
      for (const rel of refs) {
        allRelations.push(rel);
        const resultMinion = await this.storage.getMinion(rel.sourceId);
        if (resultMinion) testResults.push(resultMinion);
      }
    }

    return {
      prompt,
      versions: versions.filter((v) => v.id !== promptId),
      testResults,
      relations: allRelations,
      exportedAt: new Date().toISOString(),
    };
  }
}
