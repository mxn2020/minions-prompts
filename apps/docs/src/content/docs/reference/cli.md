---
title: CLI Reference
description: Complete command reference for @minions-prompts/cli.
---

## Installation

```bash
npm install -g @minions-prompts/cli
# or use without installing
npx @minions-prompts/cli <command>
```

The CLI reads configuration from `minions-prompts.config.json` in the current working directory when present, and falls back to sensible defaults.

---

## Commands

### `create`

Scaffold a new prompt template or version interactively.

```bash
minions-prompts create [options]
```

**Options**

| Flag | Alias | Description | Default |
|---|---|---|---|
| `--type <type>` | `-t` | Type to create: `template` or `version` | `template` |
| `--title <title>` | | Title of the new minion | prompted |
| `--content <string>` | `-c` | Inline content string | prompted |
| `--file <path>` | `-f` | Read content from a file | — |
| `--follows <id>` | | Parent template or version ID (for versions) | — |
| `--storage <path>` | | Path to storage file (JSON file backend) | `./prompts.json` |

**Examples**

```bash
# Interactive scaffold
minions-prompts create

# Create a template from a file
minions-prompts create --type template --title "Email Reply" --file ./email.txt

# Create a version that follows an existing template
minions-prompts create --type version \
  --title "Email Reply v2" \
  --follows tpl_abc123 \
  --file ./email-v2.txt
```

---

### `version`

Inspect the version chain of a prompt template.

```bash
minions-prompts version <templateId> [options]
```

**Arguments**

| Argument | Description |
|---|---|
| `templateId` | ID of the root template to inspect |

**Options**

| Flag | Description | Default |
|---|---|---|
| `--storage <path>` | Path to storage file | `./prompts.json` |
| `--json` | Output raw JSON instead of formatted table | `false` |
| `--diff` | Show a word diff between consecutive versions | `false` |

**Examples**

```bash
# Print the version chain as a table
minions-prompts version tpl_abc123

# Show diffs between each version pair
minions-prompts version tpl_abc123 --diff

# Output JSON for scripting
minions-prompts version tpl_abc123 --json | jq '.[].fields.versionNumber'
```

---

### `test`

Run the test suite attached to a prompt or compare two versions.

```bash
minions-prompts test <promptId> [options]
```

**Arguments**

| Argument | Description |
|---|---|
| `promptId` | ID of the prompt or version to test |

**Options**

| Flag | Alias | Description | Default |
|---|---|---|---|
| `--against <id>` | `-a` | Second prompt ID to run an A/B comparison | — |
| `--storage <path>` | | Path to storage file | `./prompts.json` |
| `--json` | | Emit results as JSON | `false` |
| `--threshold <n>` | | Exit with code 1 if average score is below `n` (0–1) | `0` |

**Examples**

```bash
# Run tests for a single prompt
minions-prompts test tpl_abc123

# A/B comparison — compare two versions
minions-prompts test tpl_v1 --against tpl_v2

# Fail CI if average score drops below 0.7
minions-prompts test tpl_abc123 --threshold 0.7
```

**Exit codes**

| Code | Meaning |
|---|---|
| `0` | All tests passed (or score met threshold) |
| `1` | One or more tests failed, or score below threshold |
| `2` | Storage or config error |

---

### `export`

Export a prompt to LangChain, LlamaIndex, or plain string formats.

```bash
minions-prompts export <promptId> [options]
```

**Arguments**

| Argument | Description |
|---|---|
| `promptId` | ID of the prompt to export |

**Options**

| Flag | Alias | Description | Default |
|---|---|---|---|
| `--format <fmt>` | `-f` | Output format: `langchain`, `llamaindex`, `string`, `json` | `string` |
| `--out <path>` | `-o` | Write to file instead of stdout | stdout |
| `--storage <path>` | | Path to storage file | `./prompts.json` |

**Examples**

```bash
# Print the raw prompt string
minions-prompts export tpl_abc123

# Export as a LangChain PromptTemplate (Python dict format)
minions-prompts export tpl_abc123 --format langchain

# Export to file
minions-prompts export tpl_abc123 --format json --out ./exported-prompt.json

# Export for LlamaIndex
minions-prompts export tpl_abc123 --format llamaindex
```

---

### `list`

List all prompts in the storage file.

```bash
minions-prompts list [options]
```

**Options**

| Flag | Alias | Description | Default |
|---|---|---|---|
| `--type <type>` | `-t` | Filter by type: `template`, `version`, or `all` | `all` |
| `--storage <path>` | | Path to storage file | `./prompts.json` |
| `--json` | | Output as JSON array | `false` |
| `--sort <field>` | | Sort by `createdAt`, `title`, or `type` | `createdAt` |

**Examples**

```bash
# List all prompts
minions-prompts list

# List only root templates
minions-prompts list --type template

# Machine-readable output sorted by title
minions-prompts list --json --sort title
```

**Output columns (table format)**

| Column | Description |
|---|---|
| ID | Minion ID (truncated) |
| Type | `template` or `version` |
| Title | Human-readable label |
| Created | ISO timestamp |

---

## Configuration file

Place `minions-prompts.config.json` at the project root to set persistent defaults:

```json
{
  "storage": "./data/prompts.json",
  "defaultThreshold": 0.75
}
```

All CLI flags override the config file values when provided explicitly.
