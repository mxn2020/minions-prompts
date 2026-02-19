/**
 * File-system storage for the prompts CLI.
 * Stores minions and relations as JSON in .prompts-data/
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Minion, Relation } from 'minions-sdk';
import type { PromptStorage } from 'minions-prompts';

function getDataDir(): string {
  // Walk up from cwd to find .promptsrc.json, fallback to cwd
  const dir = process.cwd();
  const dataDir = join(dir, '.prompts-data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

function loadDb(dataDir: string): { minions: Record<string, Minion>; relations: Relation[] } {
  const dbPath = join(dataDir, 'db.json');
  if (!existsSync(dbPath)) {
    return { minions: {}, relations: [] };
  }
  return JSON.parse(readFileSync(dbPath, 'utf-8'));
}

function saveDb(dataDir: string, db: { minions: Record<string, Minion>; relations: Relation[] }): void {
  const dbPath = join(dataDir, 'db.json');
  writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
}

export class FileStorage implements PromptStorage {
  private readonly dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir ?? getDataDir();
  }

  async getMinion(id: string): Promise<Minion | null> {
    const db = loadDb(this.dataDir);
    return db.minions[id] ?? null;
  }

  async saveMinion(minion: Minion): Promise<void> {
    const db = loadDb(this.dataDir);
    db.minions[minion.id] = minion;
    saveDb(this.dataDir, db);
  }

  async getRelations(options: { sourceId?: string; targetId?: string; type?: string }): Promise<Relation[]> {
    const db = loadDb(this.dataDir);
    return db.relations.filter((r) => {
      if (options.sourceId && r.sourceId !== options.sourceId) return false;
      if (options.targetId && r.targetId !== options.targetId) return false;
      if (options.type && r.type !== options.type) return false;
      return true;
    });
  }

  async saveRelation(relation: Relation): Promise<void> {
    const db = loadDb(this.dataDir);
    db.relations.push(relation);
    saveDb(this.dataDir, db);
  }
}
