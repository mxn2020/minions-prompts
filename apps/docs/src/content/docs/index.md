---
title: minions-prompts
description: GitHub for prompts — version control, testing, and A/B comparison for prompt engineering.
template: splash
hero:
  tagline: Version-controlled prompt engineering. Treat prompts like code.
  actions:
    - text: Get Started
      link: /getting-started/installation/
      icon: right-arrow
      variant: primary
    - text: View on GitHub
      link: https://github.com/mxn2020/minions-prompts
      icon: external
---

## What is minions-prompts?

`minions-prompts` is a structured prompt engineering system that gives every prompt a full version history, a test suite, and measurable quality scores. Think of it as Git for your AI prompts.

Built on the [Minions SDK](https://github.com/mxn2020/minions), it treats prompts as first-class versioned objects with typed variables, `follows` relation chains, and reproducible A/B comparisons.

## Why version prompts?

Prompts degrade silently. A change that improves one use case breaks another. Without version control, there is no way to roll back, compare, or systematically test prompt variations.

`minions-prompts` makes prompt regressions visible and reversible.

## Key features

- **Full version history** — every change is tracked via `follows` relations
- **Variable interpolation** — `{{variable}}`, `{{#if condition}}`, `{{#each items}}`
- **Test-driven development** — create test cases before changing prompts
- **A/B comparison** — run two versions against the same tests and compare scores
- **Agent self-improvement** — agents can version their own system prompts
- **Multi-language** — identical TypeScript and Python SDKs
- **Export anywhere** — LangChain, LlamaIndex, raw string, or JSON

## Quick example

```typescript
import { createMinion, generateId, now } from 'minions-sdk';
import {
  promptTemplateType, promptVersionType,
  PromptChain, PromptRenderer, PromptDiff,
  InMemoryStorage,
} from 'minions-prompts';

const storage = new InMemoryStorage();

// 1. Create a prompt template
const { minion: template } = createMinion(
  { title: 'Summarizer', fields: { content: 'Summarize {{topic}} for {{audience}}.' } },
  promptTemplateType,
);
await storage.saveMinion(template);

// 2. Render it
const renderer = new PromptRenderer();
const rendered = renderer.render(template.fields.content, {
  topic: 'quantum computing',
  audience: 'high school students',
});

// 3. Bump a version
const { minion: v2 } = createMinion(
  { title: 'Summarizer v2', fields: {
    content: 'Write a clear, engaging summary of {{topic}} suitable for {{audience}}. Focus on practical implications.',
    changelog: 'More specific instructions',
    versionNumber: 2,
  }},
  promptVersionType,
);
await storage.saveMinion(v2);
await storage.saveRelation({ id: generateId(), sourceId: v2.id, targetId: template.id, type: 'follows', createdAt: now() });

// 4. Show diff
const differ = new PromptDiff();
const diff = differ.diff(template, v2);
console.log(differ.format(diff, true));

// 5. Get version chain
const chain = new PromptChain(storage);
const versions = await chain.getVersionChain(template.id);
console.log(`${versions.length} versions in chain`);
```

```python
from minions import create_minion, generate_id, now, Relation
from minions_prompts import (
    prompt_template_type, prompt_version_type,
    PromptChain, PromptRenderer, PromptDiff,
    InMemoryStorage,
)

storage = InMemoryStorage()

# 1. Create a prompt template
template, _ = create_minion(
    {"title": "Summarizer", "fields": {"content": "Summarize {{topic}} for {{audience}}."}},
    prompt_template_type,
)
storage.save_minion(template)

# 2. Render it
renderer = PromptRenderer()
rendered = renderer.render(
    template.fields["content"],
    {"topic": "quantum computing", "audience": "high school students"},
)

# 3. Show version chain
chain = PromptChain(storage)
versions = chain.get_version_chain(template.id)
print(f"{len(versions)} version(s) in chain")
```
