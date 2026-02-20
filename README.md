# minions-prompts

**Version-controlled prompt engineering.** Track every prompt change, test variations systematically, and compare versions with measurable scores.

Think of it as Git for your AI prompts — built on the [Minions SDK](https://github.com/mxn2020/minions).

---

## The Problem

Most teams manage prompts as string constants. There's no history, no rollback, no way to prove that version 2 is actually better than version 1. When a prompt regresses, you don't know what changed or when.

## The Solution

```
prompt-template (root)
    ↑ follows
prompt-version v1
    ↑ follows
prompt-version v2  ← latest, tested, scored
```

`minions-prompts` gives every prompt a **full version chain**, a **test suite**, and **measurable quality scores**. Every change is tracked. Every version can be tested. Every A/B experiment is reproducible.

---

## Quick Example

```typescript
import { MinionsPrompts } from 'minions-prompts';

const minions = new MinionsPrompts();

// 1. Create a prompt template
const template = minions.create('prompt-template', {
  title: 'Summarizer',
  fields: { content: 'Summarize {{topic}} for {{audience}}.' },
});
await minions.prompts.storage.saveMinion(template.data);

// 2. Bump a version and link it
const v2 = minions.create('prompt-version', {
  title: 'Summarizer v2',
  fields: {
    content: 'Write a engaging summary of {{topic}} for {{audience}}.',
    versionNumber: 2,
  },
});
await minions.prompts.storage.saveMinion(v2.data);
v2.linkTo(template.data.id, 'follows');
await minions.prompts.storage.saveRelation(minions.graph.getFromSource(v2.data.id)[0]);

// 3. Show the diff
console.log(minions.prompts.diff.format(minions.prompts.diff.diff(template.data, v2.data), true));

// 4. Render with variables
console.log(minions.prompts.renderer.render(v2.data.fields.content, { topic: 'AI', audience: 'devs' }));
```

Output:
```
~ [content] "Summarize {{topic}} for {{audience}}." → "Write a clear, engaging..."
Passed: true | Scores: { relevance: 88, clarity: 85 }
Winner: v2 | Deltas: { relevance: 13, clarity: 13 }
{ template: '...', inputVariables: ['topic', 'audience'], outputParser: null }
```

---

## Installation

```bash
# TypeScript / Node.js
npm install minions-prompts minions-sdk

# Python
pip install minions-prompts

# CLI (global)
npm install -g minions-prompts-cli
```

---

## CLI

```bash
# Create a new prompt
prompts new "Customer Support Bot"

# Bump to a new version
prompts version bump <id>

# Show diff between versions
prompts diff <v1-id> <v2-id>

# Render with variables
prompts render <id> --vars tone=friendly topic=billing

# Show version history
prompts history <id>

# Export to LangChain
prompts export <id> --format langchain

# Run a test
prompts test <id> --against <test-id>
```

---

## Python SDK

```python
from minions_prompts import MinionsPrompts

minions = MinionsPrompts()

# Create
template = minions.create("prompt-template", {
    "title": "Summarizer",
    "fields": {"content": "Summarize {{topic}} for {{audience}}."}
})
minions.prompts.storage.save_minion(template.data)

# Render
rendered = minions.prompts.renderer.render(
    template.data.fields["content"], 
    {"topic": "AI", "audience": "developers"}
)

# Diff
result = minions.prompts.diff.diff(v1.data, v2.data)
print(minions.prompts.diff.format(result, colored=True))
```

---

## Documentation

Full documentation at [minions-prompts.dev](https://github.com/mxn2020/minions-prompts):

- [Getting Started](apps/docs/src/content/docs/getting-started/)
- [Core Concepts](apps/docs/src/content/docs/concepts/)
- [Guides](apps/docs/src/content/docs/guides/)
- [API Reference](apps/docs/src/content/docs/api/)
- [CLI Reference](apps/docs/src/content/docs/cli/)

---

## Project Structure

```
minions-prompts/
  packages/
    core/           # TypeScript core library (minions-prompts on npm)
    python/         # Python SDK (minions-prompts on PyPI)
    cli/            # CLI tool (minions-prompts-cli on npm)
  apps/
    docs/           # Astro Starlight documentation site
  spec/
    v0.1.md         # Complete specification
  examples/
    typescript/     # TypeScript usage examples
    python/         # Python usage examples
```

---

## Design Principles

1. **Zero storage opinions** — implement `PromptStorage` to use any backend
2. **Cross-language compatibility** — TypeScript and Python produce identical JSON
3. **Composable** — each class does one thing; use what you need
4. **Built on Minions SDK** — prompts are first-class Minion objects with full type safety

---

## License

[MIT](LICENSE)
