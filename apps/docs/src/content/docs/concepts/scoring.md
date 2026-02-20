---
title: Prompt Scoring
description: How test scoring works in minions-prompts.
---

## Overview

Scoring is the mechanism that turns subjective prompt quality into a measurable number. Every test case produces a score between `0` and its `maxScore`. The aggregate of all test case scores gives you an `averageScore` for the prompt, and comparing averages between two versions tells you definitively which one performs better.

---

## How `runTest` scores a single case

```typescript
const result = await runTest({ prompt, testCase, llm });
```

The returned `TestResult` object contains:

| Field | Type | Description |
|---|---|---|
| `testCaseId` | string | ID of the test case that was run |
| `promptId` | string | ID of the prompt that was tested |
| `response` | string | Raw string returned by the LLM |
| `score` | number | Score awarded for this case (0 – `maxScore`) |
| `maxScore` | number | Maximum possible score for this case |
| `passed` | boolean | `true` when `score === maxScore` |
| `evaluatedAt` | string | ISO timestamp of the evaluation |

### Scoring logic

1. The prompt content is rendered with `testCase.input` variable values.
2. The rendered string is passed to your `llm` function.
3. The raw response is compared against `testCase.expectedOutput`:
   - If `expectedOutput` is a plain string: the score is `maxScore` when the response contains the expected substring (case-insensitive), `0` otherwise.
   - If `expectedOutput` is a regex string (starts and ends with `/`): the pattern is tested against the response.
   - If a custom `evaluator` function is provided: the score is the value the function returns (must be in the range `0` – `maxScore`).
4. `passed` is `true` when `score === maxScore`.

---

## How `runTestSuite` aggregates scores

```typescript
const suite = await runTestSuite({ promptId, storage, llm });
```

Returned `TestSuiteResult` fields:

| Field | Type | Description |
|---|---|---|
| `promptId` | string | ID of the prompt that was tested |
| `results` | `TestResult[]` | Individual result for every test case |
| `totalCount` | number | Number of test cases that were run |
| `passedCount` | number | Number of cases where `passed === true` |
| `failedCount` | number | Number of cases where `passed === false` |
| `averageScore` | number | `sum(score) / sum(maxScore)` across all cases |
| `ranAt` | string | ISO timestamp |

### Average score formula

```
averageScore = sum(result.score for all results)
             / sum(result.maxScore for all results)
```

Using `maxScore` as the denominator (not just `totalCount`) means that high-weight test cases correctly contribute more to the aggregate than low-weight cases.

---

## How `compareVersions` calculates the delta

```typescript
const comparison = await compareVersions({ promptIdA, promptIdB, storage, llm });
```

Returned `ComparisonResult` fields:

| Field | Type | Description |
|---|---|---|
| `promptIdA` | string | First prompt |
| `promptIdB` | string | Second prompt |
| `suiteA` | `TestSuiteResult` | Full suite result for A |
| `suiteB` | `TestSuiteResult` | Full suite result for B |
| `scoreDelta` | number | `suiteB.averageScore - suiteA.averageScore` |
| `winner` | `'A' \| 'B' \| 'tie'` | Winning version |
| `tieThreshold` | number | Delta below which the result is a tie (default: `0.01`) |

### Winner determination

```
if abs(scoreDelta) < tieThreshold  → 'tie'
else if scoreDelta > 0             → 'B'
else                               → 'A'
```

The tie threshold prevents declaring a winner when the difference is within measurement noise. You can override the default:

```typescript
const comparison = await compareVersions({
  promptIdA,
  promptIdB,
  storage,
  llm,
  tieThreshold: 0.05, // require at least 5 percentage points difference
});
```

---

## Custom evaluators

For tasks where substring matching is too coarse — such as tone, factual accuracy, or instruction following — provide a custom `evaluator` function:

```typescript
import { runTest } from 'minions-prompts';

const result = await runTest({
  prompt: template,
  testCase,
  llm: async (prompt) => callOpenAI(prompt),
  evaluator: async ({ response, testCase }) => {
    // Call an LLM judge or your own scoring logic
    const judgeScore = await judgeResponseQuality(response, testCase.expectedOutput);
    // Return a number between 0 and testCase.maxScore
    return judgeScore * testCase.maxScore;
  },
});
```

Common evaluator patterns:

- **LLM-as-judge**: ask a second LLM to rate the response on a rubric and map its rating (1-5) to `0.0 – 1.0`.
- **Embedding similarity**: compute cosine similarity between the response embedding and the expected output embedding.
- **Rule-based**: check for forbidden words, required structure (JSON validity, word count), or regex patterns.

---

## Interpreting results

| `averageScore` | Meaning |
|---|---|
| 0.90 – 1.00 | Production-ready for this test dimension |
| 0.70 – 0.89 | Good; add edge-case tests and iterate |
| 0.50 – 0.69 | Marginal; the prompt needs revision |
| Below 0.50 | The prompt does not meet the defined quality bar |

A positive `scoreDelta` means version B outperforms version A. A delta of `+0.10` or more is generally considered a meaningful improvement.
