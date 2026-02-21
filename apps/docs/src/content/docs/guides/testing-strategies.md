---
title: Prompt Testing Strategies
description: Patterns for writing effective prompt tests with minions-prompts.
---

## Why test prompts?

Prompts degrade silently. A wording change that improves precision for one use case often regresses another. Without a test suite you can not know if a new version is better or worse — you are guessing.

`minions-prompts` brings test-driven development to prompt engineering: write test cases before editing a prompt, run them after every change, and let the scores tell you whether the change was an improvement.

---

## Anatomy of a test case

A test case is a minion of type `promptTestType`. It associates an input variable set with an expected output pattern and an optional scoring rubric.

```typescript
import { createMinion, generateId, now } from 'minions-sdk';
import {
  promptTestType,
  InMemoryStorage,
} from '@minions-prompts/sdk';

const storage = new InMemoryStorage();

const { minion: testCase } = createMinion(
  {
    title: 'Summarizer — short output test',
    fields: {
      templateId: template.id,
      input: { topic: 'photosynthesis', audience: 'primary school pupils' },
      expectedOutput: 'plants',        // must appear in response
      scoringCriteria: 'brevity',      // hint for evaluator
      maxScore: 1,
    },
  },
  promptTestType,
);
await storage.saveMinion(testCase);
```

### Key fields

| Field | Type | Description |
|---|---|---|
| `templateId` | string | ID of the prompt this test belongs to |
| `input` | object | Variable values to render the prompt with |
| `expectedOutput` | string | Substring or regex the LLM response must satisfy |
| `scoringCriteria` | string | Human-readable hint for the evaluator |
| `maxScore` | number | Maximum score for this case (default: 1) |

---

## Test-driven prompt development workflow

### 1. Write tests before changing the prompt

Start with the current version of the prompt and a failing test:

```bash
# Run existing suite — baseline scores
minions-prompts test tpl_abc123
```

Record the baseline score. Add new test cases that expose the gap you want to close.

### 2. Edit the prompt content

Create a new version with `createMinion` and a `follows` relation:

```typescript
const { minion: v2 } = createMinion(
  { title: 'Summarizer v2', fields: { content: '...improved content...', versionNumber: 2 } },
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

### 3. Run the test suite against the new version

```bash
minions-prompts test tpl_v2 --against tpl_abc123
```

A/B output example:

```
Template A (tpl_abc123): avg score 0.62  (8/13 tests passed)
Template B (tpl_v2):     avg score 0.81  (11/13 tests passed)
Delta: +0.19  Winner: B
```

### 4. Promote or discard

If the new version scores higher on all important test cases, promote it. If it regresses, discard it and iterate.

---

## Running test suites in code

### `scorer.runTest()` — single test case

```typescript
import { PromptScorer } from '@minions-prompts/sdk';

const scorer = new PromptScorer(storage);

// Call your LLM first, then record the evaluation
const llmResponse = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: renderedPrompt }],
});
const responseText = llmResponse.choices[0].message.content ?? '';

const result = await scorer.runTest(template.id, testCase.id, {
  scores: { accuracy: 1 },
  passed: true,
  output: responseText,
});

console.log(result.scores);       // { accuracy: 1 }
console.log(result.passed);       // boolean
console.log(result.renderedPrompt); // the rendered prompt string
```

### `scorer.runTestSuite()` — all cases for a prompt

```typescript
const results = await scorer.runTestSuite(
  template.id,
  testIds,
  evaluations, // array of { scores, passed } in the same order as testIds
);

results.forEach((r) => {
  console.log(r.testId, r.scores, r.passed);
});
```

### `scorer.compareVersions()` — A/B comparison

```typescript
const comparisons = await scorer.compareVersions(
  templateV1.id,
  templateV2.id,
  testIds,
  v1Evaluations, // array of { scores, passed } for v1
  v2Evaluations, // array of { scores, passed } for v2
);

comparisons.forEach((c) => {
  console.log(c.testId, c.winner);  // 'v1', 'v2', or 'tie'
  console.log(c.deltas);            // per-dimension score differences
});
```

---

## Interpreting scores

| Score range | Interpretation |
|---|---|
| 0.9 – 1.0 | Excellent. Prompt is reliable for this test dimension. |
| 0.7 – 0.89 | Good. Minor gaps remain; consider edge-case tests. |
| 0.5 – 0.69 | Marginal. The prompt needs improvement before production. |
| Below 0.5 | Poor. The prompt is not fit for the intended use case. |

A score is `1` when the LLM response satisfies `expectedOutput` (substring match or regex match). Partial credit is available when `maxScore > 1` and your custom evaluator function returns a fractional value.

---

## CI integration

Add a test step to your CI pipeline to prevent regressions:

```yaml
# .github/workflows/prompt-tests.yml
- name: Run prompt tests
  run: npx @minions-prompts/cli test tpl_abc123 --threshold 0.75
```

The CLI exits with code `1` when the average score falls below the threshold, failing the pipeline.

---

## Tips for writing good test cases

- **Cover edge cases**: empty inputs, very long inputs, non-English text, adversarial phrasing.
- **Use narrow expected outputs**: broad assertions (e.g., "must mention the word 'summary'") pass too easily. Narrow assertions catch regressions faster.
- **Balance the suite**: include both easy cases (sanity checks) and hard cases (real production inputs).
- **Separate concerns**: create distinct test cases for tone, length, factual accuracy, and format compliance rather than one test that tries to check everything.
- **Keep test cases in source control**: export the storage file to JSON and commit it alongside your prompt definitions.
