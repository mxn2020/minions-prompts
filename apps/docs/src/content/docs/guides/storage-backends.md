---
title: Custom Storage Backends
description: Implementing custom storage for production use with minions-prompts.
---

## Why you need a custom backend

`InMemoryStorage` is ideal for tests and local development, but it loses all data when the process restarts. Production systems need durable storage. Because `minions-prompts` programs to the `PromptStorage` interface, swapping the backend is a one-line change in your bootstrap code — nothing else in your application needs to change.

---

## The contract

```typescript
import type { Minion, Relation } from 'minions-sdk';

export interface PromptStorage {
  getMinion(id: string): Promise<Minion | null>;
  saveMinion(minion: Minion): Promise<void>;
  getRelations(sourceId: string, type?: string): Promise<Relation[]>;
  saveRelation(relation: Relation): Promise<void>;
}
```

A valid implementation must:

1. Return `null` (not throw) when a minion is not found.
2. Return an empty array (not `null`) when no relations match.
3. Overwrite on save — both minions and relations are addressed by ID and are idempotent.
4. Resolve all promises; never leave them pending indefinitely without a timeout.

---

## File system backend

Suitable for single-process servers or local tooling that needs persistence across restarts.

```typescript
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Minion, Relation } from 'minions-sdk';
import type { PromptStorage } from '@minions-prompts/sdk';

interface FileData {
  minions: Record<string, Minion>;
  relations: Record<string, Relation>;
}

export class FileStorage implements PromptStorage {
  private filePath: string;
  private cache: FileData | null = null;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
  }

  private async load(): Promise<FileData> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      this.cache = JSON.parse(raw) as FileData;
    } catch {
      this.cache = { minions: {}, relations: {} };
    }
    return this.cache;
  }

  private async flush(): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(this.cache, null, 2), 'utf-8');
  }

  async getMinion(id: string): Promise<Minion | null> {
    const data = await this.load();
    return data.minions[id] ?? null;
  }

  async saveMinion(minion: Minion): Promise<void> {
    const data = await this.load();
    data.minions[minion.id] = minion;
    await this.flush();
  }

  async getRelations(sourceId: string, type?: string): Promise<Relation[]> {
    const data = await this.load();
    return Object.values(data.relations).filter(
      (r) => r.sourceId === sourceId && (type === undefined || r.type === type),
    );
  }

  async saveRelation(relation: Relation): Promise<void> {
    const data = await this.load();
    data.relations[relation.id] = relation;
    await this.flush();
  }
}
```

**Usage:**

```typescript
import { FileStorage } from './file-storage';
import { PromptChain } from '@minions-prompts/sdk';

const storage = new FileStorage('./data/prompts.json');
const chain = new PromptChain(storage);
```

---

## Redis backend

Good for horizontally scaled services that need a shared prompt store.

```typescript
import { createClient, RedisClientType } from 'redis';
import type { Minion, Relation } from 'minions-sdk';
import type { PromptStorage } from '@minions-prompts/sdk';

export class RedisStorage implements PromptStorage {
  constructor(private client: RedisClientType) {}

  async getMinion(id: string): Promise<Minion | null> {
    const raw = await this.client.get(`minion:${id}`);
    return raw ? (JSON.parse(raw) as Minion) : null;
  }

  async saveMinion(minion: Minion): Promise<void> {
    await this.client.set(`minion:${minion.id}`, JSON.stringify(minion));
  }

  async getRelations(sourceId: string, type?: string): Promise<Relation[]> {
    const keys = await this.client.keys(`relation:${sourceId}:*`);
    if (keys.length === 0) return [];
    const raw = await this.client.mGet(keys);
    const relations = raw
      .filter((r): r is string => r !== null)
      .map((r) => JSON.parse(r) as Relation);
    return type ? relations.filter((r) => r.type === type) : relations;
  }

  async saveRelation(relation: Relation): Promise<void> {
    const key = `relation:${relation.sourceId}:${relation.id}`;
    await this.client.set(key, JSON.stringify(relation));
  }
}
```

**Usage:**

```typescript
import { createClient } from 'redis';
import { RedisStorage } from './redis-storage';

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

const storage = new RedisStorage(client as any);
```

---

## Testing your custom backend

Use the shared test helper to verify your implementation satisfies the contract:

```typescript
import { runStorageContractTests } from 'minions-prompts/testing';
import { FileStorage } from './file-storage';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('FileStorage contract', () => {
  runStorageContractTests(() => new FileStorage(join(tmpdir(), `test-${Date.now()}.json`)));
});
```

`runStorageContractTests` asserts all four methods behave correctly: get-after-save, overwrite semantics, null on missing, empty array on no relations, and type filtering.

---

## Caching layer

Wrap any backend in a read-through cache to reduce latency for frequently read templates:

```typescript
import { LRUCache } from 'lru-cache';
import type { Minion, Relation } from 'minions-sdk';
import type { PromptStorage } from '@minions-prompts/sdk';

export class CachedStorage implements PromptStorage {
  private cache = new LRUCache<string, Minion>({ max: 500, ttl: 60_000 });

  constructor(private inner: PromptStorage) {}

  async getMinion(id: string): Promise<Minion | null> {
    if (this.cache.has(id)) return this.cache.get(id)!;
    const minion = await this.inner.getMinion(id);
    if (minion) this.cache.set(id, minion);
    return minion;
  }

  async saveMinion(minion: Minion): Promise<void> {
    this.cache.set(minion.id, minion);
    await this.inner.saveMinion(minion);
  }

  async getRelations(sourceId: string, type?: string): Promise<Relation[]> {
    return this.inner.getRelations(sourceId, type);
  }

  async saveRelation(relation: Relation): Promise<void> {
    return this.inner.saveRelation(relation);
  }
}
```
