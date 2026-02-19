---
title: CLI Reference
description: Complete reference for the prompts CLI tool.
---

## Installation

```bash
npm install -g minions-prompts-cli
```

## Commands

### `prompts new <title>`

Interactively create a new prompt template.

```bash
prompts new "Email Summarizer"
```

Prompts for:
- Template content (opens editor with `{{variable}}` syntax hints)
- Description
- Variable names (comma-separated)
- Tags

### `prompts version bump <id>`

Create a new version of an existing prompt.

```bash
prompts version bump abc123

# Non-interactive:
prompts version bump abc123 --content "New prompt content here"
```

Creates a new `prompt-version` minion linked via `follows` relation.

### `prompts diff <v1-id> <v2-id>`

Show a colored diff between two versions.

```bash
prompts diff abc123 def456

# JSON output:
prompts diff abc123 def456 --json
```

Output format:
```
+ [added_field] "value"
- [removed_field] "value"
~ [changed_field] "old" → "new"
--- content ---
- old line
+ new line
```

### `prompts render <id>`

Render a prompt with variable substitution.

```bash
# Variables as CLI args:
prompts render abc123 --vars topic=AI audience=developers

# Variables from JSON file:
prompts render abc123 --vars-file vars.json
```

Outputs the rendered prompt to stdout.

### `prompts history <id>`

Show the full version history.

```bash
prompts history abc123

# JSON output:
prompts history abc123 --json
```

Output format:
```
▶ v3 Email Summarizer v3 (1/15/2024, 3:00:00 PM)
   Added length control
   ID: xyz789
◆ v2 Email Summarizer v2 (1/10/2024, 2:00:00 PM)
   Improved tone specification
   ID: def456
◆ root Email Summarizer (1/5/2024, 1:00:00 PM)
   ID: abc123
```

### `prompts export <id>`

Export a prompt to various formats.

```bash
# LangChain format:
prompts export abc123 --format langchain

# LlamaIndex format:
prompts export abc123 --format llamaindex

# Raw string with variables:
prompts export abc123 --format raw --vars topic=AI

# Full JSON (includes versions and test results):
prompts export abc123 --format json

# Save to file:
prompts export abc123 --format json --output prompt.json
```

### `prompts test <id>`

Run a test case against a prompt interactively.

```bash
prompts test abc123 --against test456

# JSON output:
prompts test abc123 --against test456 --json
```

Displays input variables, prompts for scores per dimension, and records a `prompt-result` minion.

## Configuration

Create `.promptsrc.json` in your project root to set defaults:

```json
{
  "dataDir": ".prompts-data",
  "defaultScoreDimensions": ["relevance", "clarity", "accuracy"]
}
```
