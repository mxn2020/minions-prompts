# @minions-prompts/sdk

> Version-controlled prompt engineering — track every prompt change, test variations systematically, and compare versions with measurable scores.

[![npm](https://img.shields.io/npm/v/@minions-prompts/sdk.svg)](https://www.npmjs.com/package/@minions-prompts/sdk)
[![PyPI](https://img.shields.io/pypi/v/minions-prompts.svg)](https://pypi.org/project/minions-prompts/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mxn2020/minions-prompts/blob/main/LICENSE)
[![CI](https://github.com/mxn2020/minions-prompts/actions/workflows/ci.yml/badge.svg)](https://github.com/mxn2020/minions-prompts/actions/workflows/ci.yml)

---

## The Problem

Most teams manage prompts as string constants. There's no history, no rollback, no way to prove that version 2 is actually better than version 1.

## The Solution

`@minions-prompts/sdk` gives every prompt a **full version chain**, a **test suite**, and **measurable quality scores**. Every change is tracked. Every version can be tested. Every A/B experiment is reproducible.

Built on [minions-sdk](https://www.npmjs.com/package/minions-sdk).

## Install

```bash
npm install @minions-prompts/sdk minions-sdk
```

## Quick Start

```typescript
import { MinionsPrompts } from '@minions-prompts/sdk';

const minions = new MinionsPrompts();

// 1. Create a prompt template
const template = minions.create('prompt-template', {
  title: 'Summarizer',
  fields: { content: 'Summarize {{topic}} for {{audience}}.' },
});
await minions.prompts.storage.saveMinion(template.data);

// 2. Bump a version
const v2 = minions.create('prompt-version', {
  title: 'Summarizer v2',
  fields: {
    content: 'Write an engaging summary of {{topic}} for {{audience}}.',
    versionNumber: 2,
  },
});
await minions.prompts.storage.saveMinion(v2.data);
v2.linkTo(template.data.id, 'follows');

// 3. Diff the versions
console.log(minions.prompts.diff.format(
  minions.prompts.diff.diff(template.data, v2.data), true
));

// 4. Render with variables
console.log(minions.prompts.renderer.render(
  v2.data.fields.content, { topic: 'AI', audience: 'devs' }
));
```

## Key Features

- **Version chains** — every prompt has a full history linked via `follows` relations
- **Template rendering** — `{{variable}}` interpolation with type-safe variables
- **Diffing** — field-level diffs between any two prompt versions
- **Scoring** — attach measurable scores to prompt versions for A/B comparison
- **Export** — export to LangChain, LlamaIndex, or full JSON formats
- **Test suites** — define test cases and run them against prompt versions
- **Zero storage opinions** — implement `PromptStorage` to use any backend

## API

| Export | Description |
|--------|-------------|
| `MinionsPrompts` | Unified client with version, diff, render, score, and export |
| `PromptRenderer` | `{{variable}}` template rendering |
| `PromptDiff` | Field-level diffing between prompt versions |
| `PromptScorer` | Score tracking and A/B comparison |
| `PromptExporter` | Export to LangChain / LlamaIndex / JSON |
| `PromptChain` | Chain multiple prompts together |
| `InMemoryStorage` | In-memory storage adapter for development |

## Python SDK

```bash
pip install minions-prompts
```

```python
from minions_prompts import MinionsPrompts

minions = MinionsPrompts()
template = minions.create("prompt-template", {
    "title": "Summarizer",
    "fields": {"content": "Summarize {{topic}} for {{audience}}."}
})
```

## Related

- [`@minions-prompts/cli`](https://www.npmjs.com/package/@minions-prompts/cli) — CLI tool
- [`minions-sdk`](https://www.npmjs.com/package/minions-sdk) — core Minions SDK
- 📘 [Documentation](https://minions-prompts.help)

## License

[MIT](https://github.com/mxn2020/minions-prompts/blob/main/LICENSE) — Copyright (c) 2024 Mehdi Nabhani.
