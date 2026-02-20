---
title: Field Types & Variable Syntax
description: Complete reference for variable interpolation syntax — {{variable}}, {{#if}}, {{#each}} — variable types, defaults, and rendering rules.
---

`PromptRenderer` processes three kinds of template expressions. All expressions use double-curly-brace (`{{ }}`) delimiters.

## Simple Variable Substitution

```
{{variableName}}
```

The value of `variableName` from the variables map is stringified and inserted at that position.

| Value type | Output |
|---|---|
| `string` | Inserted as-is |
| `number` | Converted with `String()` |
| `boolean` | `"true"` or `"false"` |
| `object` / `array` | `JSON.stringify()` output |
| `null` / `undefined` | Empty string `""` |

**Example:**

```
Template: "Summarize {{topic}} for {{audience}}."
Variables: { topic: "quantum computing", audience: "high school students" }
Output:   "Summarize quantum computing for high school students."
```

### Escaping Braces

To include a literal `{{` in the output, prefix it with a backslash:

```
Template: "Use the syntax \{{variable}} in your templates."
Output:   "Use the syntax {{variable}} in your templates."
```

### Missing Variables

By default (`strict: true`), an unresolved variable is left as the raw `{{variableName}}` token in the output. Strict mode does not throw on simple substitution failures — use `requiredVariables` for that.

```typescript
renderer.render('Hello {{name}}', {}, { strict: false });
// → 'Hello {{name}}'

renderer.render('Hello {{name}}', {}, {
  requiredVariables: ['name'],  // throws RendererError if name is missing
});
```

## Conditional Blocks: `{{#if}}`

```
{{#if conditionVariable}}
  content rendered when conditionVariable is truthy
{{/if}}
```

The block is rendered only when `conditionVariable` is **truthy**. Truthiness follows these rules:

| Value | Truthy? |
|---|---|
| Non-empty string | Yes |
| Non-zero number | Yes |
| `true` | Yes |
| Non-empty array | Yes |
| Non-empty object | Yes |
| `false` | No |
| `""` (empty string) | No |
| `0` | No |
| `null` / `undefined` | No |
| `[]` (empty array) | No |

**Example:**

```
{{#if priority}}
This ticket is classified as {{priority}} priority.
{{/if}}
```

With `{ priority: "high" }` → renders the block.
With `{ priority: "" }` or omitted → renders nothing.

Nested `{{#if}}` blocks are not supported in the current renderer. Compose conditions in your variable map instead.

## Iteration Blocks: `{{#each}}`

```
{{#each arrayVariable}}
  content for each item
{{/each}}
```

Iterates over an array. Two modes:

### Object Items

When each array element is an object, its keys become available as variables inside the block:

```
{{#each steps}}
Step {{number}}: {{description}}
{{/each}}
```

```typescript
renderer.render(template, {
  steps: [
    { number: 1, description: 'Install dependencies' },
    { number: 2, description: 'Configure environment' },
  ],
});
// Step 1: Install dependencies
// Step 2: Configure environment
```

### Primitive Items

When each element is a string or number, use `{{this}}` to reference the current item:

```
Tools available: {{#each tools}}{{this}}, {{/each}}
```

```typescript
renderer.render(template, { tools: ['search', 'calculator', 'weather'] });
// Tools available: search, calculator, weather,
```

### Empty or Missing Arrays

If the variable is absent, `null`, or an empty array, the `{{#each}}` block renders as an empty string — no error is thrown regardless of strict mode.

## Variable Types (`PromptVariableType`)

When declaring variables in a `promptVariableType` minion, you specify one of:

| Type | Description | Example value |
|---|---|---|
| `string` | Free text | `"quantum computing"` |
| `number` | Numeric value | `42` |
| `boolean` | True/false flag | `true` |
| `array` | Ordered list | `["a", "b", "c"]` |
| `object` | Key-value map | `{ "key": "value" }` |

### Variable Declaration Fields

A `PromptVariable` object has these fields:

```typescript
interface PromptVariable {
  name: string;            // e.g. "audience"
  type: PromptVariableType;
  description?: string;   // Human-readable explanation
  required: boolean;       // Enforced via requiredVariables option
  defaultValue?: unknown;  // Not auto-applied by renderer; use in your calling code
  example?: string;        // Illustrative example for documentation
}
```

Variable declarations are stored separately as `promptVariableType` minions linked to the template, not automatically parsed from the template content. The renderer itself only reads the variables map you pass at render time.

## Extracting Variables from a Template

`PromptRenderer.extractVariables` scans a template string and returns all referenced variable names:

```typescript
const renderer = new PromptRenderer();
const names = renderer.extractVariables(
  'Write about {{topic}} for {{audience}}. {{#if formal}}Use formal language.{{/if}}'
);
// → ['topic', 'audience', 'formal']
```

This is used internally by `PromptExporter.toLangChain` to populate `inputVariables`.

## Rendering Options Reference

```typescript
renderer.render(template, variables, {
  strict?: boolean;            // Default: true. Controls whether unknown variables are left as tokens.
  requiredVariables?: string[]; // Names that must be present; throws RendererError if missing.
});
```

`RendererError` exposes a `missingVariables` array for programmatic handling:

```typescript
import { RendererError } from '@minions-prompts/sdk';

try {
  renderer.render('Hello {{name}}', {}, { requiredVariables: ['name'] });
} catch (err) {
  if (err instanceof RendererError) {
    console.error('Missing:', err.missingVariables); // ['name']
  }
}
```
