# @minions-prompts/cli

> CLI for version-controlled prompt engineering — create, version, diff, render, and test prompts from the terminal.

[![npm](https://img.shields.io/npm/v/@minions-prompts/cli.svg)](https://www.npmjs.com/package/@minions-prompts/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mxn2020/minions-prompts/blob/main/LICENSE)

---

## Install

```bash
npm install -g @minions-prompts/cli
```

## Commands

```
prompts <command> [options]

COMMANDS:
  new <title>               Create a new prompt template
  version bump <id>         Bump to a new version
  diff <v1-id> <v2-id>      Show diff between two versions
  render <id> --vars k=v    Render a prompt with variables
  history <id>              Show version history
  export <id> --format fmt  Export (langchain | llamaindex | json)
  test <id> --against <id>  Run a test against a prompt version
```

## Usage Examples

### Create a new prompt

```bash
prompts new "Customer Support Bot"
```

### Bump a version

```bash
prompts version bump <prompt-id>
```

### Render with variables

```bash
prompts render <id> --vars tone=friendly topic=billing
```

### Diff two versions

```bash
prompts diff <v1-id> <v2-id>
```

### Export to LangChain format

```bash
prompts export <id> --format langchain
```

## Related

- [`@minions-prompts/sdk`](https://www.npmjs.com/package/@minions-prompts/sdk) — TypeScript SDK
- [`minions-sdk`](https://www.npmjs.com/package/minions-sdk) — core Minions SDK
- 📘 [Documentation](https://minions-prompts.help)

## License

[MIT](https://github.com/mxn2020/minions-prompts/blob/main/LICENSE) — Copyright (c) 2024 Mehdi Nabhani.
