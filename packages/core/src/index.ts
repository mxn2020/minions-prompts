/**
 * @module minions-prompts
 * Version-controlled prompt engineering system built on the Minions SDK.
 *
 * @example
 * ```typescript
 * import {
 *   PromptChain, PromptRenderer, PromptDiff, PromptScorer, PromptExporter,
 *   InMemoryStorage, registerPromptTypes,
 *   promptTemplateType, promptVersionType,
 * } from 'minions-prompts';
 * import { createMinion, generateId, now } from 'minions-sdk';
 *
 * const storage = new InMemoryStorage();
 *
 * // Create a prompt template
 * const { minion: template } = createMinion(
 *   { title: 'Summarizer', fields: { content: 'Summarize {{topic}} for {{audience}}.' } },
 *   promptTemplateType,
 * );
 * await storage.saveMinion(template);
 *
 * // Render it
 * const renderer = new PromptRenderer();
 * const rendered = renderer.render(template.fields.content, { topic: 'AI', audience: 'developers' });
 * ```
 */

// Schemas & registration
export {
  promptTemplateType,
  promptVersionType,
  promptVariableType,
  promptTestType,
  promptResultType,
  promptTypes,
  registerPromptTypes,
} from './schemas.js';

// Core classes
export { PromptChain } from './PromptChain.js';
export { PromptRenderer, RendererError } from './PromptRenderer.js';
export { PromptDiff } from './PromptDiff.js';
export { PromptScorer } from './PromptScorer.js';
export { PromptExporter } from './PromptExporter.js';
export { InMemoryStorage } from './InMemoryStorage.js';

// Types
export type {
  PromptVariableType,
  PromptVariable,
  PromptTemplateFields,
  PromptVersionFields,
  PromptVariableFields,
  PromptTestFields,
  PromptResultFields,
  DiffLine,
  DiffResult,
  LangChainExport,
  LlamaIndexExport,
  FullJsonExport,
  TestRunResult,
  ComparisonResult,
  PromptStorage,
} from './types.js';
