# minions-prompts Conformance Guide

This document defines what it means for an implementation to be conformant with the minions-prompts specification.

## Conformance Levels

### Level 1: Core (Required)

All implementations MUST support:

1. **Template rendering**: Variable substitution via `{{variable}}` syntax
2. **Conditional blocks**: `{{#if condition}}...{{/if}}` with truthy/falsy evaluation
3. **Iteration blocks**: `{{#each array}}...{{/each}}` with `{{this}}` access
4. **Required variable validation**: `RendererError` (or equivalent) when required variables are missing
5. **Variable extraction**: `extractVariables()` returns all referenced variable names
6. **Version chains**: `follows` relations between prompt minions, `getVersionChain()` traversal
7. **Latest version**: `getLatestVersion()` returns the most recent leaf in the chain
8. **Historical lookup**: `getVersionAtDate()` returns the version active at a given timestamp
9. **Field-level diff**: `diff()` detects added, removed, and changed fields between two versions
10. **Storage interface**: `getMinion`, `saveMinion`, `getRelations`, `saveRelation` operations
11. **Prompt type schemas**: All five types registered: `prompt-template`, `prompt-version`, `prompt-variable`, `prompt-test`, `prompt-result`

### Level 2: Testing (Recommended)

Implementations SHOULD support:

1. **Test execution**: `runTest()` renders a prompt with test variables and records results
2. **Test suites**: `runTestSuite()` runs multiple tests against a single prompt
3. **Version comparison**: `compareVersions()` with delta scoring and tie detection
4. **Result storage**: Test result minions saved with `minionTypeId: 'minions-prompts/prompt-result'`

### Level 3: Export (Optional)

Implementations MAY support:

1. **Raw export**: `toRaw()` renders the final prompt string
2. **LangChain format**: `toLangChain()` returns `{ template, inputVariables }`
3. **LlamaIndex format**: `toLlamaIndex()` returns `{ template, templateVars }`
4. **Full JSON export**: `toJSON()` returns versioned export with test results and relations

## Testing Conformance

```typescript
import { PromptRenderer, PromptChain, InMemoryStorage } from '@minions-prompts/sdk';

// Level 1: Verify template rendering
const renderer = new PromptRenderer();
const result = renderer.render('Hello {{name}}!', { name: 'World' });
assert(result === 'Hello World!');

// Level 1: Verify if/each blocks
const conditional = renderer.render('{{#if show}}visible{{/if}}', { show: true });
assert(conditional === 'visible');

const list = renderer.render('{{#each items}}{{this}} {{/each}}', { items: ['a', 'b'] });
assert(list === 'a b ');

// Level 1: Verify required variable validation
try {
  renderer.render('{{name}}', {}, { requiredVariables: ['name'] });
  assert(false, 'Should have thrown');
} catch (e) {
  assert(e instanceof RendererError);
}

// Level 1: Verify version chain
const storage = new InMemoryStorage();
const chain = new PromptChain(storage);
// ... save minions and follows relations, then getVersionChain()
```

---

*minions-prompts Specification v0.1.0 — MIT*
