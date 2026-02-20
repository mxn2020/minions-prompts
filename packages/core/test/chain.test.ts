import { describe, it, expect, beforeEach } from 'vitest';
import type { Minion, Relation } from 'minions-sdk';
import { PromptChain } from '../src/PromptChain.js';
import { InMemoryStorage } from '../src/InMemoryStorage.js';

function makeMinion(id: string, fields: Record<string, unknown> = {}, createdAt?: string): Minion {
  return {
    id,
    title: `Prompt ${id}`,
    minionTypeId: 'minions-prompts/prompt-template',
    fields,
    createdAt: createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeFollows(sourceId: string, targetId: string): Relation {
  return {
    id: `rel-${sourceId}-${targetId}`,
    sourceId,
    targetId,
    type: 'follows',
    createdAt: new Date().toISOString(),
  };
}

describe('PromptChain', () => {
  let storage: InMemoryStorage;
  let chain: PromptChain;

  beforeEach(() => {
    storage = new InMemoryStorage();
    chain = new PromptChain(storage);
  });

  it('returns a single-element chain for a standalone prompt', async () => {
    const root = makeMinion('root', { content: 'Hello world' });
    await storage.saveMinion(root);

    const result = await chain.getVersionChain('root');
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('root');
  });

  it('returns ordered chain for a linear version history', async () => {
    const v1 = makeMinion('v1', { content: 'v1' }, '2025-01-01T00:00:00.000Z');
    const v2 = makeMinion('v2', { content: 'v2' }, '2025-01-02T00:00:00.000Z');
    const v3 = makeMinion('v3', { content: 'v3' }, '2025-01-03T00:00:00.000Z');
    await storage.saveMinion(v1);
    await storage.saveMinion(v2);
    await storage.saveMinion(v3);
    // v2 follows v1, v3 follows v2
    await storage.saveRelation(makeFollows('v2', 'v1'));
    await storage.saveRelation(makeFollows('v3', 'v2'));

    const result = await chain.getVersionChain('v1');
    expect(result).toHaveLength(3);
    expect(result[0]!.id).toBe('v1');
    expect(result[1]!.id).toBe('v2');
    expect(result[2]!.id).toBe('v3');
  });

  it('getVersionChain works from any node in the chain', async () => {
    const v1 = makeMinion('v1', { content: 'v1' }, '2025-01-01T00:00:00.000Z');
    const v2 = makeMinion('v2', { content: 'v2' }, '2025-01-02T00:00:00.000Z');
    await storage.saveMinion(v1);
    await storage.saveMinion(v2);
    await storage.saveRelation(makeFollows('v2', 'v1'));

    const result = await chain.getVersionChain('v2');
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe('v1');
    expect(result[1]!.id).toBe('v2');
  });

  it('getLatestVersion returns the newest leaf', async () => {
    const v1 = makeMinion('v1', { content: 'v1' }, '2025-01-01T00:00:00.000Z');
    const v2 = makeMinion('v2', { content: 'v2' }, '2025-01-02T00:00:00.000Z');
    await storage.saveMinion(v1);
    await storage.saveMinion(v2);
    await storage.saveRelation(makeFollows('v2', 'v1'));

    const latest = await chain.getLatestVersion('v1');
    expect(latest.id).toBe('v2');
  });

  it('getLatestVersion returns root for single-element chain', async () => {
    const root = makeMinion('root', { content: 'Only version' });
    await storage.saveMinion(root);

    const latest = await chain.getLatestVersion('root');
    expect(latest.id).toBe('root');
  });

  it('getVersionAtDate returns version active at specific date', async () => {
    const v1 = makeMinion('v1', { content: 'v1' }, '2025-01-01T00:00:00.000Z');
    const v2 = makeMinion('v2', { content: 'v2' }, '2025-01-03T00:00:00.000Z');
    await storage.saveMinion(v1);
    await storage.saveMinion(v2);
    await storage.saveRelation(makeFollows('v2', 'v1'));

    const result = await chain.getVersionAtDate('v1', new Date('2025-01-02T00:00:00.000Z'));
    expect(result?.id).toBe('v1');
  });

  it('getVersionAtDate returns latest version when date is after all versions', async () => {
    const v1 = makeMinion('v1', { content: 'v1' }, '2025-01-01T00:00:00.000Z');
    const v2 = makeMinion('v2', { content: 'v2' }, '2025-01-02T00:00:00.000Z');
    await storage.saveMinion(v1);
    await storage.saveMinion(v2);
    await storage.saveRelation(makeFollows('v2', 'v1'));

    const result = await chain.getVersionAtDate('v1', new Date('2025-06-01T00:00:00.000Z'));
    expect(result?.id).toBe('v2');
  });

  it('getVersionAtDate returns null when date is before chain start', async () => {
    const v1 = makeMinion('v1', { content: 'v1' }, '2025-06-01T00:00:00.000Z');
    await storage.saveMinion(v1);

    const result = await chain.getVersionAtDate('v1', new Date('2025-01-01T00:00:00.000Z'));
    expect(result).toBeNull();
  });
});
