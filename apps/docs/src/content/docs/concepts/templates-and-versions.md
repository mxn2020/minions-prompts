---
title: Prompt Templates & Versions
description: Understand the difference between a prompt template and a prompt version.
---

## Prompt Template

A **prompt template** is the living, current representation of a prompt. It contains:

- The prompt body with `{{variable}}` placeholders
- A list of declared variable names
- Optional tags and description

Think of it as the `main` branch of your prompt.

## Prompt Version

A **prompt version** is an immutable snapshot of a prompt at a point in time. Each version:

- Has its own content, changelog, and version number
- Is linked to its predecessor via a `follows` relation
- Can be tested and scored independently

Think of it as a tagged commit.

## The Relationship

```
prompt-template (root, "current")
    ↑ follows
prompt-version v1 (snapshot, immutable)
    ↑ follows
prompt-version v2 (snapshot, immutable) ← latest
```

The `follows` relation always points from newer to older: `source` is the newer version, `target` is the older one.

## When to Create a Version

Create a new version whenever you want to:

1. Track a specific change for comparison
2. Set up an A/B test
3. Enable rollback to a known-good state
4. Archive a version for regulatory/audit purposes
