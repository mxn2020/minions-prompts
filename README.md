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
import { createMinion, generateId, now } from 'minions-sdk';
import {
  promptTemplateType, promptVersionType, promptTestType,
  PromptChain, PromptRenderer, PromptDiff, PromptScorer, PromptExporter,
  InMemoryStorage,
} from 'minions-prompts';

const storage = new InMemoryStorage();

// 1. Create a prompt template
const { minion: template } = createMinion(
  { title: 'Summarizer', fields: { content: 'Summarize {{topic}} for {{audience}}.' } },
  promptTemplateType,
);
await storage.saveMinion(template);

// 2. Bump a version with a changelog
const { minion: v2 } = createMinion(
  { title: 'Summarizer v2', fields: {
    content: 'Write a clear, engaging summary of {{topic}} for {{audience}}. Focus on practical implications.',
    changelog: 'More specific instructions for better focus',
    versionNumber: 2,
  }},
  promptVersionType,
);
await storage.saveMinion(v2);
await storage.saveRelation({ id: generateId(), sourceId: v2.id, targetId: template.id, type: 'follows', createdAt: now() });

// 3. Show the diff
const differ = new PromptDiff();
console.log(differ.format(differ.diff(template, v2), true));

// 4. Render with variables
const renderer = new PromptRenderer();
console.log(renderer.render(v2.fields.content, { topic: 'quantum computing', audience: 'high school students' }));

// 5. Create and run a test
const { minion: test } = createMinion(
  { title: 'Tech test', fields: { inputVariables: { topic: 'AI agents', audience: 'developers' }, scoringDimensions: ['relevance', 'clarity'] }},
  promptTestType,
);
await storage.saveMinion(test);

const scorer = new PromptScorer(storage);
const result = await scorer.runTest(v2.id, test.id, { scores: { relevance: 88, clarity: 85 }, passed: true });
console.log('Passed:', result.passed, '| Scores:', result.scores);

// 6. A/B compare v1 vs v2
const comparisons = await scorer.compareVersions(template.id, v2.id, [test.id],
  [{ scores: { relevance: 75, clarity: 72 }, passed: true }],
  [{ scores: { relevance: 88, clarity: 85 }, passed: true }],
);
console.log('Winner:', comparisons[0].winner, '| Deltas:', comparisons[0].deltas);

// 7. Export to LangChain
const exporter = new PromptExporter(storage);
const langchain = await exporter.toLangChain(v2.id);
console.log(langchain);
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
from minions import create_minion, generate_id, now, Relation
from minions_prompts import (
    prompt_template_type, PromptRenderer, PromptChain,
    PromptDiff, PromptScorer, InMemoryStorage,
)

storage = InMemoryStorage()

# Create
template, _ = create_minion(
    {"title": "Summarizer", "fields": {"content": "Summarize {{topic}} for {{audience}}."}},
    prompt_template_type,
)
storage.save_minion(template)

# Render
renderer = PromptRenderer()
rendered = renderer.render(template.fields["content"], {"topic": "AI", "audience": "developers"})

# Diff
differ = PromptDiff()
result = differ.diff(v1, v2)
print(differ.format(result, colored=True))

# Score
scorer = PromptScorer(storage)
test_result = scorer.run_test(prompt_id, test_id, scores={"relevance": 85}, passed=True)
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

[AGPL-3.0](LICENSE)
