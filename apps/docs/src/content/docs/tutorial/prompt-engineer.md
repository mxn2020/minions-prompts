---
title: Prompt Engineering Tutorial
description: End-to-end walkthrough — create a prompt template, version it, run A/B tests, compare results, and export to LangChain.
---

This tutorial walks through the complete minions-prompts workflow: from writing your first template to shipping a tested, versioned prompt to a production LangChain pipeline.

## Prerequisites

Install the SDK and initialise storage:

```typescript
import {
  promptTemplateType, promptVersionType, promptTestType,
  PromptChain, PromptRenderer, PromptDiff,
  PromptScorer, PromptExporter, InMemoryStorage,
} from '@minions-prompts/sdk';
import { createMinion, generateId, now } from 'minions-sdk';

const storage = new InMemoryStorage();
```

```python
from minions import create_minion, generate_id, now, Relation
from minions_prompts import (
    prompt_template_type, prompt_version_type, prompt_test_type,
    PromptChain, PromptRenderer, PromptDiff,
    PromptScorer, PromptExporter, InMemoryStorage,
)

storage = InMemoryStorage()
```

## Step 1: Create a Prompt Template

A **prompt template** is the canonical definition of a prompt. It holds the content, optional variable declarations, and metadata tags.

```typescript
const { minion: template } = createMinion(
  {
    title: 'Customer Support Reply',
    fields: {
      content: `You are a helpful support agent for {{company}}.

The customer has reported: {{issue}}

{{#if priority}}
This is a {{priority}} priority ticket. Respond accordingly.
{{/if}}

Write a concise, empathetic reply that:
- Acknowledges the customer's frustration
- Provides a clear next step
- Ends with a friendly sign-off`,
      description: 'Generates a support reply given a company, issue, and optional priority.',
      tags: ['support', 'customer-service'],
    },
  },
  promptTemplateType,
);
await storage.saveMinion(template);
console.log('Template ID:', template.id);
```

```python
template, _ = create_minion(
    {
        "title": "Customer Support Reply",
        "fields": {
            "content": (
                "You are a helpful support agent for {{company}}.\n\n"
                "The customer has reported: {{issue}}\n\n"
                "{{#if priority}}\n"
                "This is a {{priority}} priority ticket. Respond accordingly.\n"
                "{{/if}}\n\n"
                "Write a concise, empathetic reply that:\n"
                "- Acknowledges the customer's frustration\n"
                "- Provides a clear next step\n"
                "- Ends with a friendly sign-off"
            ),
            "description": "Generates a support reply given a company, issue, and optional priority.",
            "tags": ["support", "customer-service"],
        },
    },
    prompt_template_type,
)
storage.save_minion(template)
print("Template ID:", template.id)
```

## Step 2: Render and Inspect

Use `PromptRenderer` to verify the template resolves correctly before creating test cases.

```typescript
const renderer = new PromptRenderer();

const preview = renderer.render(template.fields.content, {
  company: 'Acme Corp',
  issue: 'Login button not working on mobile',
  priority: 'high',
});
console.log(preview);

// Without the optional priority:
const minimal = renderer.render(template.fields.content, {
  company: 'Acme Corp',
  issue: 'Login button not working on mobile',
}, { strict: false });
```

```python
renderer = PromptRenderer()

preview = renderer.render(template.fields["content"], {
    "company": "Acme Corp",
    "issue": "Login button not working on mobile",
    "priority": "high",
})
print(preview)
```

## Step 3: Create Test Cases

Test cases capture the input variables and the criteria you expect the output to satisfy. They are stored as minions so they travel alongside the prompt through its entire version history.

```typescript
const { minion: test1 } = createMinion(
  {
    title: 'High-priority login bug',
    fields: {
      inputVariables: {
        company: 'Acme Corp',
        issue: 'Login button not working on mobile',
        priority: 'high',
      },
      expectedCriteria: 'Reply must acknowledge urgency and mention escalation path.',
      scoringDimensions: ['empathy', 'clarity', 'actionability'],
    },
  },
  promptTestType,
);

const { minion: test2 } = createMinion(
  {
    title: 'Billing question — no priority',
    fields: {
      inputVariables: {
        company: 'Acme Corp',
        issue: 'I was charged twice last month.',
      },
      expectedCriteria: 'Reply must mention refund process and timeline.',
      scoringDimensions: ['empathy', 'clarity', 'actionability'],
    },
  },
  promptTestType,
);

await storage.saveMinion(test1);
await storage.saveMinion(test2);
```

## Step 4: Score the Baseline

`PromptScorer.runTest` renders the prompt, records the result as a minion, and links it to both the test and the prompt via `references` relations. You supply the scores — these typically come from an LLM judge or your own evaluation function.

```typescript
const scorer = new PromptScorer(storage);

const baseline1 = await scorer.runTest(template.id, test1.id, {
  scores: { empathy: 72, clarity: 80, actionability: 65 },
  passed: true,
  output: '[actual LLM output here]',
});

const baseline2 = await scorer.runTest(template.id, test2.id, {
  scores: { empathy: 68, clarity: 75, actionability: 70 },
  passed: true,
});

console.log('Baseline empathy:', baseline1.scores.empathy);
```

## Step 5: Create a New Version

After inspecting the baseline scores you decide to improve the prompt. Create a new version minion and link it to the template with a `follows` relation.

```typescript
const { minion: v2 } = createMinion(
  {
    title: 'Customer Support Reply v2',
    fields: {
      content: `You are an expert support agent for {{company}}. Your tone is warm, professional, and solution-focused.

The customer's issue: {{issue}}

{{#if priority}}
Priority level: {{priority}} — treat this with appropriate urgency.
{{/if}}

Your reply must:
1. Open by validating the customer's experience in one sentence.
2. State the specific next step you will take or they should take.
3. Give a realistic time expectation.
4. Close warmly with your name (use "Support Team" if unknown).

Keep the reply under 120 words.`,
      changelog: 'Added structure, word limit, and time expectation requirement.',
      versionNumber: 2,
    },
  },
  promptVersionType,
);

await storage.saveMinion(v2);
await storage.saveRelation({
  id: generateId(),
  sourceId: v2.id,
  targetId: template.id,
  type: 'follows',
  createdAt: now(),
});
```

## Step 6: A/B Compare Versions

`PromptScorer.compareVersions` runs both versions against the same test IDs and returns per-test deltas and a winner.

```typescript
const comparisons = await scorer.compareVersions(
  template.id,
  v2.id,
  [test1.id, test2.id],
  // v1 evaluations (re-use the baseline scores we already have)
  [
    { scores: { empathy: 72, clarity: 80, actionability: 65 }, passed: true },
    { scores: { empathy: 68, clarity: 75, actionability: 70 }, passed: true },
  ],
  // v2 evaluations
  [
    { scores: { empathy: 88, clarity: 90, actionability: 85 }, passed: true },
    { scores: { empathy: 82, clarity: 88, actionability: 80 }, passed: true },
  ],
);

for (const c of comparisons) {
  console.log(`Test ${c.testId}: winner = ${c.winner}`);
  console.log('  Deltas:', c.deltas);
}
// Test <id1>: winner = v2, Deltas: { empathy: 16, clarity: 10, actionability: 20 }
// Test <id2>: winner = v2, Deltas: { empathy: 14, clarity: 13, actionability: 10 }
```

## Step 7: Inspect the Version Chain

```typescript
const chain = new PromptChain(storage);
const versions = await chain.getVersionChain(template.id);
console.log(`${versions.length} version(s) in chain`);
// Ordered newest → oldest: [v2, template]
```

## Step 8: Diff the Content

```typescript
const differ = new PromptDiff();
const diff = differ.diff(template, v2);

console.log('Added fields:', diff.added.map(a => a.field));
console.log('Changed fields:', diff.changed.map(c => c.field));
console.log(differ.format(diff, true)); // true = include content line diff
```

## Step 9: Export to LangChain

Once v2 wins the A/B test, export it for use in your LangChain pipeline.

```typescript
const exporter = new PromptExporter(storage);

const langchainExport = await exporter.toLangChain(v2.id);
console.log(langchainExport);
// {
//   template: 'You are an expert support agent for {{company}}...',
//   inputVariables: ['company', 'issue', 'priority'],
//   outputParser: null,
// }

// Use in LangChain (Node):
// import { PromptTemplate } from 'langchain/prompts';
// const pt = new PromptTemplate(langchainExport);
```

```python
exporter = PromptExporter(storage)

lc = exporter.to_lang_chain(v2.id)
print(lc)
# {
#   "template": "You are an expert support agent for {{company}}...",
#   "inputVariables": ["company", "issue", "priority"],
#   "outputParser": None
# }

# from langchain.prompts import PromptTemplate
# pt = PromptTemplate(**lc)
```

## Step 10: Export Full JSON Archive

```typescript
const fullExport = await exporter.toJSON(template.id);
// Includes: prompt, all versions, all test results, all relations, exportedAt timestamp.

import { writeFileSync } from 'fs';
writeFileSync('support-prompt-export.json', JSON.stringify(fullExport, null, 2));
```

## Summary

You have now completed the full minions-prompts workflow:

1. Created a prompt template with typed variables and conditional blocks.
2. Rendered and previewed it before writing tests.
3. Stored test cases as minions alongside the prompt.
4. Scored the baseline with `PromptScorer.runTest`.
5. Wrote an improved version and linked it via a `follows` relation.
6. Ran an A/B comparison with `compareVersions` and confirmed v2 wins.
7. Inspected the version chain and content diff.
8. Exported to LangChain for production use.

The entire history — templates, versions, test cases, and results — lives in storage and can be queried, diffed, or exported at any time.
