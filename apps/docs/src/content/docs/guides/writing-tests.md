---
title: Writing Effective Prompt Tests
description: Best practices for creating prompt test cases that catch real regressions.
---

## Rule 1: Write the test before changing the prompt

Like TDD for code, define what "passing" means before you make changes. This prevents you from unconsciously writing tests that match whatever your new version happens to produce.

## Rule 2: Use realistic input variables

Test with inputs that represent your actual production traffic:

```json
{
  "topic": "the effects of monetary policy on inflation",
  "audience": "undergraduate economics students",
  "length": "3"
}
```

Avoid trivial or toy inputs — they don't catch edge cases.

## Rule 3: Score multiple dimensions

A single "quality" score hides regressions. Use separate dimensions:

- **relevance** — does the output address the prompt?
- **clarity** — is the output easy to understand?
- **accuracy** — are the facts correct?
- **tone** — does the style match expectations?

## Rule 4: Write crisp expectedCriteria

The `expectedCriteria` field is the source of truth for human (or LLM judge) evaluation:

> "The summary should be 2-3 sentences, use plain language, and focus on practical impact rather than technical details."

Vague criteria ("should be good") produce inconsistent scores across evaluators.

## Rule 5: Create test suites, not one-off tests

Use `runTestSuite()` to batch-evaluate a prompt across multiple diverse inputs. Track average scores by dimension over time.
