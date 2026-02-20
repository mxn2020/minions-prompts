/**
 * @module minions-prompts/schemas
 * Minion Type definitions for the five prompt primitive types.
 * Registered automatically when you import from minions-prompts.
 */

import type { MinionType } from 'minions-sdk';
import { TypeRegistry } from 'minions-sdk';

/** Minion Type for prompt templates. */
export const promptTemplateType: MinionType = {
  id: 'minions-prompts/prompt-template',
  name: 'Prompt Template',
  slug: 'prompt-template',
  description: 'A reusable prompt with variable placeholders and version history.',
  icon: '📝',
  schema: [
    {
      name: 'content',
      type: 'textarea',
      label: 'Content',
      description: 'The prompt body. Use {{variable}} for placeholders.',
      required: true,
    },
    {
      name: 'description',
      type: 'string',
      label: 'Description',
      description: 'Purpose and usage notes for this prompt.',
    },
    {
      name: 'variables',
      type: 'tags',
      label: 'Variables',
      description: 'Variable names used in this template.',
    },
    {
      name: 'tags',
      type: 'tags',
      label: 'Tags',
      description: 'Freeform categorization tags.',
    },
  ],
  isSystem: false,
};

/** Minion Type for versioned prompt snapshots. */
export const promptVersionType: MinionType = {
  id: 'minions-prompts/prompt-version',
  name: 'Prompt Version',
  slug: 'prompt-version',
  description: 'A versioned snapshot of a prompt template.',
  icon: '🔖',
  schema: [
    {
      name: 'content',
      type: 'textarea',
      label: 'Content',
      description: 'The versioned prompt body.',
      required: true,
    },
    {
      name: 'description',
      type: 'string',
      label: 'Description',
    },
    {
      name: 'versionNumber',
      type: 'number',
      label: 'Version Number',
      description: 'Monotonically increasing version index.',
    },
    {
      name: 'changelog',
      type: 'textarea',
      label: 'Changelog',
      description: 'What changed in this version.',
    },
    {
      name: 'variables',
      type: 'tags',
      label: 'Variables',
    },
    {
      name: 'tags',
      type: 'tags',
      label: 'Tags',
    },
  ],
  isSystem: false,
};

/** Minion Type for typed variable definitions. */
export const promptVariableType: MinionType = {
  id: 'minions-prompts/prompt-variable',
  name: 'Prompt Variable',
  slug: 'prompt-variable',
  description: 'A typed variable definition for use in prompt templates.',
  icon: '🔣',
  schema: [
    {
      name: 'variableType',
      type: 'select',
      label: 'Type',
      options: ['string', 'number', 'boolean', 'array', 'object'],
      required: true,
      defaultValue: 'string',
    },
    {
      name: 'description',
      type: 'string',
      label: 'Description',
    },
    {
      name: 'defaultValue',
      type: 'string',
      label: 'Default Value',
    },
    {
      name: 'required',
      type: 'boolean',
      label: 'Required',
      defaultValue: false,
    },
    {
      name: 'example',
      type: 'string',
      label: 'Example',
    },
  ],
  isSystem: false,
};

/** Minion Type for prompt test cases. */
export const promptTestType: MinionType = {
  id: 'minions-prompts/prompt-test',
  name: 'Prompt Test',
  slug: 'prompt-test',
  description: 'A test case with input variables and expected behavior criteria.',
  icon: '🧪',
  schema: [
    {
      name: 'inputVariables',
      type: 'json',
      label: 'Input Variables',
      description: 'JSON object mapping variable names to test values.',
      required: true,
      defaultValue: {},
    },
    {
      name: 'expectedCriteria',
      type: 'textarea',
      label: 'Expected Criteria',
      description: 'Human-readable description of expected output behavior.',
    },
    {
      name: 'scoringDimensions',
      type: 'tags',
      label: 'Scoring Dimensions',
      description: 'Dimensions to score, e.g. relevance, coherence, accuracy.',
    },
  ],
  isSystem: false,
};

/** Minion Type for test execution results. */
export const promptResultType: MinionType = {
  id: 'minions-prompts/prompt-result',
  name: 'Prompt Result',
  slug: 'prompt-result',
  description: 'The result of running a test case against a prompt version.',
  icon: '📊',
  schema: [
    {
      name: 'renderedPrompt',
      type: 'textarea',
      label: 'Rendered Prompt',
      description: 'The prompt after variable substitution.',
      required: true,
    },
    {
      name: 'output',
      type: 'textarea',
      label: 'Output',
      description: 'Actual LLM output (if captured).',
    },
    {
      name: 'scores',
      type: 'json',
      label: 'Scores',
      description: 'Map of scoring dimension to score (0–100).',
      required: true,
      defaultValue: {},
    },
    {
      name: 'metadata',
      type: 'json',
      label: 'Metadata',
      description: 'Model, temperature, token counts, etc.',
    },
    {
      name: 'passed',
      type: 'boolean',
      label: 'Passed',
      required: true,
      defaultValue: false,
    },
  ],
  isSystem: false,
};

/** All prompt-specific Minion Types. */
export const promptTypes = [
  promptTemplateType,
  promptVersionType,
  promptVariableType,
  promptTestType,
  promptResultType,
];

/**
 * Register all prompt Minion Types into a TypeRegistry.
 *
 * @param registry - The TypeRegistry to register into. Creates a new one if omitted.
 * @returns The registry with all types registered.
 */
export function registerPromptTypes(registry?: TypeRegistry): TypeRegistry {
  const reg = registry ?? new TypeRegistry();
  for (const type of promptTypes) {
    if (reg.has(type.id)) continue;

    const existing = reg.getBySlug(type.slug);
    if (existing) {
      reg.remove(existing.id);
    }

    reg.register(type);
  }
  return reg;
}
