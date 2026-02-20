import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStorage } from '../src/InMemoryStorage.js';
import type { Minion, Relation } from 'minions-sdk';

function makeMinion(id: string): Minion {
  return {
    id,
    title: `Minion ${id}`,
    minionTypeId: 'test-type',
    fields: { data: id },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeRelation(id: string, sourceId: string, targetId: string): Relation {
  return {
    id,
    sourceId,
    targetId,
    type: 'follows',
    createdAt: new Date().toISOString(),
  };
}

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  it('saves a minion and retrieves it by id', async () => {
    const minion = makeMinion('m1');
    await storage.saveMinion(minion);

    const retrieved = await storage.getMinion('m1');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe('m1');
    expect(retrieved!.title).toBe('Minion m1');
  });

  it('saves multiple minions and lists all via getAllMinions', async () => {
    const m1 = makeMinion('list1');
    const m2 = makeMinion('list2');
    const m3 = makeMinion('list3');
    await storage.saveMinion(m1);
    await storage.saveMinion(m2);
    await storage.saveMinion(m3);

    const all = storage.getAllMinions();
    expect(all).toHaveLength(3);
    const ids = all.map((m) => m.id);
    expect(ids).toContain('list1');
    expect(ids).toContain('list2');
    expect(ids).toContain('list3');
  });

  it('getRelations returns empty array when no relations exist', async () => {
    const relations = await storage.getRelations({ sourceId: 'nobody' });
    expect(relations).toEqual([]);
  });

  it('saves a relation and retrieves it via getRelations', async () => {
    const m1 = makeMinion('src1');
    const m2 = makeMinion('tgt1');
    await storage.saveMinion(m1);
    await storage.saveMinion(m2);

    const relation = makeRelation('rel-1', 'src1', 'tgt1');
    await storage.saveRelation(relation);

    const bySource = await storage.getRelations({ sourceId: 'src1' });
    expect(bySource).toHaveLength(1);
    expect(bySource[0]!.id).toBe('rel-1');
    expect(bySource[0]!.targetId).toBe('tgt1');

    const byTarget = await storage.getRelations({ targetId: 'tgt1' });
    expect(byTarget).toHaveLength(1);
    expect(byTarget[0]!.sourceId).toBe('src1');
  });

  it('overwriting an existing minion with saveMinion replaces it', async () => {
    const original = makeMinion('overwrite-me');
    await storage.saveMinion(original);

    const updated: Minion = {
      ...original,
      title: 'Updated Title',
      fields: { data: 'new-data' },
    };
    await storage.saveMinion(updated);

    const retrieved = await storage.getMinion('overwrite-me');
    expect(retrieved!.title).toBe('Updated Title');
    expect((retrieved!.fields as Record<string, unknown>)['data']).toBe('new-data');

    // Should still be exactly one entry (not duplicated)
    const all = storage.getAllMinions();
    const matches = all.filter((m) => m.id === 'overwrite-me');
    expect(matches).toHaveLength(1);
  });
});
