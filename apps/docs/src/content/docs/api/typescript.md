---
title: TypeScript API Reference
description: Complete API reference for the minions-prompts TypeScript library.
---

## Installation

```bash
npm install minions-prompts minions-sdk
```

## PromptChain

Traverses `follows` relations to reconstruct version history.

```typescript
class PromptChain {
  constructor(storage: PromptStorage)

  // Returns all versions, oldest first
  getVersionChain(promptId: string): Promise<Minion[]>

  // Returns the most recent leaf version
  getLatestVersion(promptId: string): Promise<Minion>

  // Returns the version active at a specific date
  getVersionAtDate(promptId: string, date: Date): Promise<Minion | null>
}
```

## PromptRenderer

Variable interpolation engine.

```typescript
class PromptRenderer {
  // Render a template with variable substitution
  render(
    template: string,
    variables?: Record<string, unknown>,
    options?: { strict?: boolean; requiredVariables?: string[] }
  ): string

  // Extract all variable names from a template
  extractVariables(template: string): string[]
}
```

## PromptDiff

Field-level and line-level diff.

```typescript
class PromptDiff {
  // Compare two minions field by field
  diff(v1: Minion, v2: Minion): DiffResult

  // Format as a human-readable string
  format(result: DiffResult, colored?: boolean): string
}
```

## PromptScorer

Test execution and A/B comparison.

```typescript
class PromptScorer {
  constructor(storage: PromptStorage)

  // Run a single test case
  runTest(promptId, testId, evaluation): Promise<TestRunResult>

  // Run multiple test cases
  runTestSuite(promptId, testIds, evaluations): Promise<TestRunResult[]>

  // Compare two versions A/B
  compareVersions(v1Id, v2Id, testIds, v1Evals, v2Evals): Promise<ComparisonResult[]>
}
```

## PromptExporter

Export to external formats.

```typescript
class PromptExporter {
  constructor(storage: PromptStorage)

  toRaw(promptId: string, variables?: Record<string, unknown>): Promise<string>
  toLangChain(promptId: string): Promise<LangChainExport>
  toLlamaIndex(promptId: string): Promise<LlamaIndexExport>
  toJSON(promptId: string): Promise<FullJsonExport>
}
```

## InMemoryStorage

In-memory storage for development and testing.

```typescript
class InMemoryStorage implements PromptStorage {
  getMinion(id: string): Promise<Minion | null>
  saveMinion(minion: Minion): Promise<void>
  getRelations(options): Promise<Relation[]>
  saveRelation(relation: Relation): Promise<void>
  getAllMinions(): Minion[]
  getAllRelations(): Relation[]
  clear(): void
}
```

## Minion Types

```typescript
import {
  promptTemplateType,   // MinionType for prompt templates
  promptVersionType,    // MinionType for prompt versions
  promptVariableType,   // MinionType for variable definitions
  promptTestType,       // MinionType for test cases
  promptResultType,     // MinionType for test results
} from 'minions-prompts';
```

## Types

```typescript
interface PromptStorage {
  getMinion(id: string): Promise<Minion | null>;
  saveMinion(minion: Minion): Promise<void>;
  getRelations(options: { sourceId?: string; targetId?: string; type?: string }): Promise<Relation[]>;
  saveRelation(relation: Relation): Promise<void>;
}

interface DiffResult {
  added: Array<{ field: string; value: unknown }>;
  removed: Array<{ field: string; value: unknown }>;
  changed: Array<{ field: string; from: unknown; to: unknown }>;
  contentDiff?: DiffLine[];
}

interface LangChainExport {
  template: string;
  inputVariables: string[];
  outputParser: null;
}

interface LlamaIndexExport {
  template: string;
  templateVars: string[];
}
```
