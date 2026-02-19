/**
 * @module minions-prompts/PromptChain
 * Traverses `follows` relations to reconstruct complete prompt version history.
 */

import type { Minion, Relation } from 'minions-sdk';
import type { PromptStorage } from './types.js';

/**
 * Traverses `follows` relations to reconstruct the complete lineage of a prompt.
 *
 * @example
 * ```typescript
 * const storage = new InMemoryStorage();
 * const chain = new PromptChain(storage);
 * const versions = await chain.getVersionChain(promptId);
 * const latest = await chain.getLatestVersion(promptId);
 * ```
 */
export class PromptChain {
  constructor(private readonly storage: PromptStorage) {}

  /**
   * Returns all versions of a prompt in chronological order (oldest first).
   *
   * Traverses `follows` relations from the given prompt/version backwards to
   * the root, then reverses to give oldest-first ordering.
   *
   * @param promptId - The ID of a prompt-template or prompt-version minion.
   * @returns Array of minions forming the version chain, oldest first.
   */
  async getVersionChain(promptId: string): Promise<Minion[]> {
    const visited = new Set<string>();
    const chain: Minion[] = [];

    // BFS forward from root: find all minions that follow (transitively) this root
    // Strategy: start at the given ID and walk backwards via `follows` targets to find root,
    // then walk forwards to collect all versions
    
    // First, find the root by walking backwards
    const root = await this.findRoot(promptId);
    
    // Then collect all versions starting from root using BFS
    const queue = [root.id];
    visited.add(root.id);
    chain.push(root);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      // Find all minions that follow the current one (i.e., sourceId = X, targetId = currentId, type = follows)
      const followingRelations = await this.storage.getRelations({
        targetId: currentId,
        type: 'follows',
      });

      for (const rel of followingRelations) {
        if (!visited.has(rel.sourceId)) {
          visited.add(rel.sourceId);
          const minion = await this.storage.getMinion(rel.sourceId);
          if (minion) {
            chain.push(minion);
            queue.push(rel.sourceId);
          }
        }
      }
    }

    // Sort by createdAt for consistent ordering
    chain.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return chain;
  }

  /**
   * Returns the most recent version in the chain.
   *
   * "Latest" is defined as the version with the greatest `createdAt` timestamp
   * among all leaf nodes (versions with no successors).
   *
   * @param promptId - The ID of any minion in the version chain.
   * @returns The latest version minion.
   */
  async getLatestVersion(promptId: string): Promise<Minion> {
    const chain = await this.getVersionChain(promptId);
    if (chain.length === 0) {
      throw new Error(`No version chain found for prompt ${promptId}`);
    }

    // Find leaf nodes (versions with no successors in the chain)
    const chainIds = new Set(chain.map((m) => m.id));
    const leafNodes: Minion[] = [];

    for (const minion of chain) {
      const successors = await this.storage.getRelations({
        targetId: minion.id,
        type: 'follows',
      });
      const chainSuccessors = successors.filter((r) => chainIds.has(r.sourceId));
      if (chainSuccessors.length === 0) {
        leafNodes.push(minion);
      }
    }

    // Return the leaf with the latest createdAt
    leafNodes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return leafNodes[0]!;
  }

  /**
   * Returns the version that was active at a specific point in time.
   *
   * Returns the most recently created version with a `createdAt` ≤ the given date.
   *
   * @param promptId - The ID of any minion in the version chain.
   * @param date - The target date/time.
   * @returns The version active at that date, or null if none existed yet.
   */
  async getVersionAtDate(promptId: string, date: Date): Promise<Minion | null> {
    const chain = await this.getVersionChain(promptId);
    const targetMs = date.getTime();

    const candidates = chain.filter(
      (m) => new Date(m.createdAt).getTime() <= targetMs,
    );

    if (candidates.length === 0) return null;

    // Return the latest one at or before the given date
    candidates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return candidates[0]!;
  }

  /** Walks backwards via `follows` targets to find the chain root. */
  private async findRoot(startId: string): Promise<Minion> {
    const visited = new Set<string>();
    let currentId = startId;

    while (true) {
      if (visited.has(currentId)) {
        throw new Error(`Cycle detected in follows chain at ${currentId}`);
      }
      visited.add(currentId);

      // Find what this version follows (i.e., sourceId = currentId, type = follows)
      const followsRelations = await this.storage.getRelations({
        sourceId: currentId,
        type: 'follows',
      });

      if (followsRelations.length === 0) {
        // This is the root
        const minion = await this.storage.getMinion(currentId);
        if (!minion) throw new Error(`Minion not found: ${currentId}`);
        return minion;
      }

      // Walk to the predecessor
      currentId = followsRelations[0]!.targetId;
    }
  }
}
