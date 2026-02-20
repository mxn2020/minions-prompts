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

  // --- New tests ---

  it('chain of 5 versions returns all 5 in order', async () => {
    const dates = [
      '2025-01-01T00:00:00.000Z',
      '2025-01-02T00:00:00.000Z',
      '2025-01-03T00:00:00.000Z',
      '2025-01-04T00:00:00.000Z',
      '2025-01-05T00:00:00.000Z',
    ];
    const versions = dates.map((d, i) => makeMinion(`cv${i + 1}`, { content: `v${i + 1}` }, d));
    for (const v of versions) {
      await storage.saveMinion(v);
    }
    // cv2 follows cv1, cv3 follows cv2, ... cv5 follows cv4
    for (let i = 1; i < 5; i++) {
      await storage.saveRelation(makeFollows(`cv${i + 1}`, `cv${i}`));
    }

    const result = await chain.getVersionChain('cv1');
    expect(result).toHaveLength(5);
    expect(result.map((m) => m.id)).toEqual(['cv1', 'cv2', 'cv3', 'cv4', 'cv5']);
  });

  it('getVersionAtDate with exact timestamp match returns that version', async () => {
    const exactDate = '2025-03-15T12:00:00.000Z';
    const v1 = makeMinion('ex1', { content: 'v1' }, '2025-03-01T00:00:00.000Z');
    const v2 = makeMinion('ex2', { content: 'v2' }, exactDate);
    await storage.saveMinion(v1);
    await storage.saveMinion(v2);
    await storage.saveRelation(makeFollows('ex2', 'ex1'));

    const result = await chain.getVersionAtDate('ex1', new Date(exactDate));
    expect(result?.id).toBe('ex2');
  });

  it('getLatestVersion with 5-version chain returns v5', async () => {
    const dates = [
      '2025-02-01T00:00:00.000Z',
      '2025-02-02T00:00:00.000Z',
      '2025-02-03T00:00:00.000Z',
      '2025-02-04T00:00:00.000Z',
      '2025-02-05T00:00:00.000Z',
    ];
    const versions = dates.map((d, i) => makeMinion(`lv${i + 1}`, { content: `v${i + 1}` }, d));
    for (const v of versions) {
      await storage.saveMinion(v);
    }
    for (let i = 1; i < 5; i++) {
      await storage.saveRelation(makeFollows(`lv${i + 1}`, `lv${i}`));
    }

    const latest = await chain.getLatestVersion('lv1');
    expect(latest.id).toBe('lv5');
  });

  it('getVersionChain preserves createdAt timestamps on each minion', async () => {
    const t1 = '2025-04-01T00:00:00.000Z';
    const t2 = '2025-04-02T00:00:00.000Z';
    const v1 = makeMinion('ts1', { content: 'v1' }, t1);
    const v2 = makeMinion('ts2', { content: 'v2' }, t2);
    await storage.saveMinion(v1);
    await storage.saveMinion(v2);
    await storage.saveRelation(makeFollows('ts2', 'ts1'));

    const result = await chain.getVersionChain('ts1');
    expect(result[0]!.createdAt).toBe(t1);
    expect(result[1]!.createdAt).toBe(t2);
  });

  it('getVersionChain from the deepest node still returns full chain', async () => {
    const v1 = makeMinion('dp1', { content: 'v1' }, '2025-05-01T00:00:00.000Z');
    const v2 = makeMinion('dp2', { content: 'v2' }, '2025-05-02T00:00:00.000Z');
    const v3 = makeMinion('dp3', { content: 'v3' }, '2025-05-03T00:00:00.000Z');
    await storage.saveMinion(v1);
    await storage.saveMinion(v2);
    await storage.saveMinion(v3);
    await storage.saveRelation(makeFollows('dp2', 'dp1'));
    await storage.saveRelation(makeFollows('dp3', 'dp2'));

    // Start from the deepest (most recent) node
    const result = await chain.getVersionChain('dp3');
    expect(result).toHaveLength(3);
    expect(result[0]!.id).toBe('dp1');
    expect(result[1]!.id).toBe('dp2');
    expect(result[2]!.id).toBe('dp3');
  });

  it('getVersionAtDate between v2 and v3 returns v2', async () => {
    const v1 = makeMinion('bt1', { content: 'v1' }, '2025-06-01T00:00:00.000Z');
    const v2 = makeMinion('bt2', { content: 'v2' }, '2025-06-10T00:00:00.000Z');
    const v3 = makeMinion('bt3', { content: 'v3' }, '2025-06-20T00:00:00.000Z');
    await storage.saveMinion(v1);
    await storage.saveMinion(v2);
    await storage.saveMinion(v3);
    await storage.saveRelation(makeFollows('bt2', 'bt1'));
    await storage.saveRelation(makeFollows('bt3', 'bt2'));

    // Query a date between v2 and v3 creation dates
    const result = await chain.getVersionAtDate('bt1', new Date('2025-06-15T00:00:00.000Z'));
    expect(result?.id).toBe('bt2');
  });

  it('two chains in storage — getVersionChain only returns its own chain', async () => {
    // Chain A: a1 → a2
    const a1 = makeMinion('a1', { content: 'a1' }, '2025-07-01T00:00:00.000Z');
    const a2 = makeMinion('a2', { content: 'a2' }, '2025-07-02T00:00:00.000Z');
    // Chain B: b1 → b2
    const b1 = makeMinion('b1', { content: 'b1' }, '2025-07-03T00:00:00.000Z');
    const b2 = makeMinion('b2', { content: 'b2' }, '2025-07-04T00:00:00.000Z');

    await storage.saveMinion(a1);
    await storage.saveMinion(a2);
    await storage.saveMinion(b1);
    await storage.saveMinion(b2);
    await storage.saveRelation(makeFollows('a2', 'a1'));
    await storage.saveRelation(makeFollows('b2', 'b1'));

    const resultA = await chain.getVersionChain('a1');
    expect(resultA).toHaveLength(2);
    expect(resultA.map((m) => m.id)).toEqual(['a1', 'a2']);

    const resultB = await chain.getVersionChain('b1');
    expect(resultB).toHaveLength(2);
    expect(resultB.map((m) => m.id)).toEqual(['b1', 'b2']);
  });

  it('empty storage — getVersionChain returns just the requested minion', async () => {
    const solo = makeMinion('solo', { content: 'alone' }, '2025-08-01T00:00:00.000Z');
    await storage.saveMinion(solo);

    const result = await chain.getVersionChain('solo');
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('solo');
  });
});
