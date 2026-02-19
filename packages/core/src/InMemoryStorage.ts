/**
 * @module minions-prompts/InMemoryStorage
 * A simple in-memory storage implementation for development and testing.
 * Not suitable for production use.
 */

import type { Minion, Relation } from 'minions-sdk';
import type { PromptStorage } from './types.js';

/**
 * In-memory implementation of PromptStorage.
 * Useful for testing and development without a database.
 *
 * @example
 * ```typescript
 * const storage = new InMemoryStorage();
 * const chain = new PromptChain(storage);
 * ```
 */
export class InMemoryStorage implements PromptStorage {
  private readonly minions = new Map<string, Minion>();
  private readonly relations: Relation[] = [];

  async getMinion(id: string): Promise<Minion | null> {
    return this.minions.get(id) ?? null;
  }

  async saveMinion(minion: Minion): Promise<void> {
    this.minions.set(minion.id, minion);
  }

  async getRelations(options: {
    sourceId?: string;
    targetId?: string;
    type?: string;
  }): Promise<Relation[]> {
    return this.relations.filter((r) => {
      if (options.sourceId && r.sourceId !== options.sourceId) return false;
      if (options.targetId && r.targetId !== options.targetId) return false;
      if (options.type && r.type !== options.type) return false;
      return true;
    });
  }

  async saveRelation(relation: Relation): Promise<void> {
    this.relations.push(relation);
  }

  /** Returns all stored minions (useful for debugging). */
  getAllMinions(): Minion[] {
    return Array.from(this.minions.values());
  }

  /** Returns all stored relations (useful for debugging). */
  getAllRelations(): Relation[] {
    return [...this.relations];
  }

  /** Clears all stored data. */
  clear(): void {
    this.minions.clear();
    this.relations.length = 0;
  }
}
