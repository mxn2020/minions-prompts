---
title: Storage Backends
description: Reference for PromptStorage interface and InMemoryStorage implementation.
---

## Overview

`minions-prompts` stores prompt templates, versions, and their relations through a `PromptStorage` interface. By programming to the interface you can swap out the storage layer without touching any business logic — ship with `InMemoryStorage` during development and plug in a database backend in production.

---

## PromptStorage Interface

```typescript
import type { Minion, Relation } from 'minions-sdk';

export interface PromptStorage {
  getMinion(id: string): Promise<Minion | null>;
  saveMinion(minion: Minion): Promise<void>;
  getRelations(sourceId: string, type?: string): Promise<Relation[]>;
  saveRelation(relation: Relation): Promise<void>;
}
```

### Methods

#### `getMinion(id: string): Promise<Minion | null>`

Retrieves a single minion by its ID. Returns `null` when no matching record is found. Implementations must not throw on a missing ID — callers use the `null` check to handle the not-found case.

#### `saveMinion(minion: Minion): Promise<void>`

Persists or replaces a minion. If a record with `minion.id` already exists, the implementation must overwrite it so that `getMinion` returns the updated state immediately after the call resolves.

#### `getRelations(sourceId: string, type?: string): Promise<Relation[]>`

Returns every relation whose `sourceId` matches the argument. The optional `type` parameter filters results to a single relation type (e.g., `'follows'`). Return an empty array — never `null` — when no relations are found.

#### `saveRelation(relation: Relation): Promise<void>`

Persists a relation. Relation IDs are caller-generated. If a relation with the same ID already exists, the implementation should overwrite it.

---

## InMemoryStorage

`InMemoryStorage` is the built-in reference implementation backed by two `Map` objects — one for minions and one for relations. It is synchronous internally but exposes the same `Promise`-based interface as any production backend.

```typescript
import { InMemoryStorage } from 'minions-prompts';

const storage = new InMemoryStorage();
```

### When to use

| Scenario | Recommendation |
|---|---|
| Unit and integration tests | Use `InMemoryStorage` — fast, no setup |
| Local CLI experiments | Use `InMemoryStorage` — zero config |
| Production services | Implement a custom backend |
| Edge functions / serverless | Implement a custom backend (e.g., KV store) |

### Behaviour details

- **Isolation**: Each `new InMemoryStorage()` instance starts completely empty. Tests that construct their own instance are automatically isolated from each other.
- **No persistence**: Data is lost when the process exits. This is intentional for tests; avoid it in long-running services unless data loss is acceptable.
- **Thread safety**: Node.js is single-threaded; `InMemoryStorage` makes no concurrency guarantees beyond that.

---

## Implementing a Custom Backend

Any class that satisfies the four-method contract is a valid storage backend. The example below persists minions and relations to a PostgreSQL database via `pg`.

```typescript
import { Pool } from 'pg';
import type { Minion, Relation } from 'minions-sdk';
import type { PromptStorage } from 'minions-prompts';

export class PostgresStorage implements PromptStorage {
  constructor(private pool: Pool) {}

  async getMinion(id: string): Promise<Minion | null> {
    const { rows } = await this.pool.query(
      'SELECT data FROM minions WHERE id = $1',
      [id],
    );
    return rows.length > 0 ? (rows[0].data as Minion) : null;
  }

  async saveMinion(minion: Minion): Promise<void> {
    await this.pool.query(
      `INSERT INTO minions (id, data) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
      [minion.id, JSON.stringify(minion)],
    );
  }

  async getRelations(sourceId: string, type?: string): Promise<Relation[]> {
    const query = type
      ? 'SELECT data FROM relations WHERE source_id = $1 AND type = $2'
      : 'SELECT data FROM relations WHERE source_id = $1';
    const params = type ? [sourceId, type] : [sourceId];
    const { rows } = await this.pool.query(query, params);
    return rows.map((r) => r.data as Relation);
  }

  async saveRelation(relation: Relation): Promise<void> {
    await this.pool.query(
      `INSERT INTO relations (id, source_id, type, data) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
      [relation.id, relation.sourceId, relation.type, JSON.stringify(relation)],
    );
  }
}
```

### Wiring it up

```typescript
import { Pool } from 'pg';
import { PromptChain } from 'minions-prompts';
import { PostgresStorage } from './postgres-storage';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const storage = new PostgresStorage(pool);
const chain = new PromptChain(storage);
```

### Tips for custom backends

- Always implement `getMinion` as a read-through (no side effects).
- Wrap `saveMinion` and `saveRelation` in a retry or transaction if your database can experience transient failures.
- For key-value stores (Redis, Cloudflare KV), serialize minions as JSON strings and use a composite key like `minion:<id>` to avoid collisions.
- Consider a read-through cache layer (`LRU`) in front of slow backends for hot prompt templates that are rendered on every request.
