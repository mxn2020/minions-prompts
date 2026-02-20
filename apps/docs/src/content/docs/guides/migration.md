---
title: Migration Guide
description: How to upgrade between versions of minions-prompts.
---

## Versioning strategy

`minions-prompts` follows [Semantic Versioning](https://semver.org/):

- **Patch** (`x.y.Z`): Bug fixes. No changes to the public API or storage schema.
- **Minor** (`x.Y.0`): New features added in a backward-compatible manner. Existing code continues to work without changes.
- **Major** (`X.0.0`): Breaking changes. Storage schema changes, renamed exports, or modified interfaces may require migration steps.

Check the [CHANGELOG](https://github.com/mxn2020/minions-prompts/blob/main/CHANGELOG.md) for the full list of changes in each release.

---

## Upgrading packages

### TypeScript / JavaScript

```bash
# Upgrade to the latest version
npm install minions-prompts@latest

# Upgrade to a specific version
npm install minions-prompts@2.0.0
```

Check peer dependencies after upgrading:

```bash
npm ls minions-sdk
```

`minions-prompts` has a peer dependency on `minions-sdk`. Both must be on compatible versions.

### Python

```bash
# Latest
pip install --upgrade minions-prompts

# Specific version
pip install "minions-prompts==2.0.0"
```

---

## 1.x to 2.x

### Breaking changes

#### Storage interface: `getRelations` now requires `sourceId` (not `minionId`)

In 1.x, `getRelations` accepted `minionId` as its first parameter. In 2.x this is renamed to `sourceId` to match the `Relation` struct field name. If you have a custom storage backend, update the parameter name in your implementation:

```typescript
// Before (1.x)
async getRelations(minionId: string, type?: string): Promise<Relation[]>

// After (2.x)
async getRelations(sourceId: string, type?: string): Promise<Relation[]>
```

The semantics are identical — only the parameter name changed. If you use TypeScript, the compiler will surface this as a type error.

#### `PromptDiff.format()` — `colored` parameter removed

In 1.x, `PromptDiff.format(diff, colored)` accepted a boolean to toggle ANSI color codes. In 2.x, coloring is detected automatically from the terminal environment. Remove the second argument:

```typescript
// Before (1.x)
const formatted = differ.format(diff, true);

// After (2.x)
const formatted = differ.format(diff);
```

#### `createPromptVersion` helper removed

The standalone `createPromptVersion` utility function was removed in favor of using `createMinion` with `promptVersionType` directly. Replace:

```typescript
// Before (1.x)
import { createPromptVersion } from 'minions-prompts';
const version = createPromptVersion({ content: '...', changelog: '...' }, templateId);

// After (2.x)
import { createMinion, generateId, now } from 'minions-sdk';
import { promptVersionType } from 'minions-prompts';
const { minion: version } = createMinion(
  { title: 'My prompt v2', fields: { content: '...', changelog: '...', versionNumber: 2 } },
  promptVersionType,
);
await storage.saveRelation({
  id: generateId(),
  sourceId: version.id,
  targetId: templateId,
  type: 'follows',
  createdAt: now(),
});
```

### Storage schema: no migration required

The minion and relation schemas are additive between 1.x and 2.x. Existing `prompts.json` files load correctly in 2.x without modification.

### Python: method naming convention change

All Python methods now use `snake_case` consistently. If you used any methods that were previously `camelCase` aliases in 1.x (e.g., `saveMinion`), rename them:

| 1.x | 2.x |
|---|---|
| `storage.saveMinion(m)` | `storage.save_minion(m)` |
| `storage.getMinion(id)` | `storage.get_minion(id)` |
| `storage.saveRelation(r)` | `storage.save_relation(r)` |
| `storage.getRelations(id)` | `storage.get_relations(id)` |

---

## 0.x to 1.x

Version 0.x was a pre-release API. Full migration notes are in the [0.x to 1.x migration doc](https://github.com/mxn2020/minions-prompts/blob/main/docs/migration-0-to-1.md).

---

## Checking for deprecation warnings

Both the TypeScript and Python packages emit deprecation warnings at runtime when you use APIs that will be removed in the next major version. Enable verbose logging to see them:

```bash
# Node.js
NODE_OPTIONS=--trace-deprecation node your-script.js

# Python
MINIONS_LOG_LEVEL=debug python your_script.py
```

Address all deprecation warnings before upgrading to the next major version to minimise migration effort.

---

## Getting help

If you encounter an issue not covered here, open a [GitHub Discussion](https://github.com/mxn2020/minions-prompts/discussions) with your current version, target version, and a minimal reproduction.
