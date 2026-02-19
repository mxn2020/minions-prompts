/**
 * @module minions-prompts/types
 * Domain-specific type definitions for the minions-prompts system.
 * Built on top of the minions-sdk primitives.
 */

import type { Minion, Relation } from 'minions-sdk';

/** Variable types supported in prompt templates. */
export type PromptVariableType = 'string' | 'number' | 'boolean' | 'array' | 'object';

/** A variable definition embedded in a prompt template or version. */
export interface PromptVariable {
  name: string;
  type: PromptVariableType;
  description?: string;
  required: boolean;
  defaultValue?: unknown;
  example?: string;
}

/** Fields stored in a prompt-template minion. */
export interface PromptTemplateFields {
  content: string;
  description?: string;
  variables?: string[];
  tags?: string[];
}

/** Fields stored in a prompt-version minion. */
export interface PromptVersionFields {
  content: string;
  description?: string;
  versionNumber?: number;
  changelog?: string;
  variables?: string[];
  tags?: string[];
}

/** Fields stored in a prompt-variable minion. */
export interface PromptVariableFields {
  variableType: PromptVariableType;
  description?: string;
  defaultValue?: string;
  required: boolean;
  example?: string;
}

/** Fields stored in a prompt-test minion. */
export interface PromptTestFields {
  inputVariables: Record<string, unknown>;
  expectedCriteria?: string;
  scoringDimensions?: string[];
}

/** Fields stored in a prompt-result minion. */
export interface PromptResultFields {
  renderedPrompt: string;
  output?: string;
  scores: Record<string, number>;
  metadata?: Record<string, unknown>;
  passed: boolean;
}

/** A typed Minion for prompt templates. */
export type PromptTemplateMinion = Minion & { fields: PromptTemplateFields };

/** A typed Minion for prompt versions. */
export type PromptVersionMinion = Minion & { fields: PromptVersionFields };

/** A typed Minion for prompt tests. */
export type PromptTestMinion = Minion & { fields: PromptTestFields };

/** A typed Minion for prompt results. */
export type PromptResultMinion = Minion & { fields: PromptResultFields };

/** A single line in a content diff. */
export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  text: string;
  lineNumber?: number;
}

/** Result of comparing two prompt versions. */
export interface DiffResult {
  /** Fields present in v2 but not v1. */
  added: Array<{ field: string; value: unknown }>;
  /** Fields present in v1 but not v2. */
  removed: Array<{ field: string; value: unknown }>;
  /** Fields present in both but with different values. */
  changed: Array<{ field: string; from: unknown; to: unknown }>;
  /** Line-level diff of the content field. */
  contentDiff?: DiffLine[];
}

/** LangChain PromptTemplate export format. */
export interface LangChainExport {
  template: string;
  inputVariables: string[];
  outputParser: null;
}

/** LlamaIndex PromptTemplate export format. */
export interface LlamaIndexExport {
  template: string;
  templateVars: string[];
}

/** Full JSON export including history and results. */
export interface FullJsonExport {
  prompt: Minion;
  versions: Minion[];
  testResults: Minion[];
  relations: Relation[];
  exportedAt: string;
}

/** A single test run result from PromptScorer. */
export interface TestRunResult {
  promptId: string;
  testId: string;
  renderedPrompt: string;
  scores: Record<string, number>;
  passed: boolean;
  result: Minion;
}

/** Comparison result from A/B testing two versions. */
export interface ComparisonResult {
  v1Id: string;
  v2Id: string;
  testId: string;
  v1Result: TestRunResult;
  v2Result: TestRunResult;
  /** Score deltas: positive means v2 improved. */
  deltas: Record<string, number>;
  winner: 'v1' | 'v2' | 'tie';
}

/** Storage interface — implement to persist minions and relations. */
export interface PromptStorage {
  getMinion(id: string): Promise<Minion | null>;
  saveMinion(minion: Minion): Promise<void>;
  getRelations(options: { sourceId?: string; targetId?: string; type?: string }): Promise<Relation[]>;
  saveRelation(relation: Relation): Promise<void>;
}
