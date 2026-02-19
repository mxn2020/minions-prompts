import { describe, it, expect } from '@jest/globals';
import { PromptDiff } from '../src/PromptDiff.js';
import type { Minion } from 'minions-sdk';

function makeMinion(fields: Record<string, unknown>, title = 'Test'): Minion {
  return {
    id: 'test-id',
    title,
    minionTypeId: 'minions-prompts/prompt-version',
    fields,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('PromptDiff', () => {
  const differ = new PromptDiff();

  it('detects added fields', () => {
    const v1 = makeMinion({ content: 'hello' });
    const v2 = makeMinion({ content: 'hello', changelog: 'Added feature' });
    const result = differ.diff(v1, v2);
    expect(result.added.some(a => a.field === 'changelog')).toBe(true);
  });

  it('detects removed fields', () => {
    const v1 = makeMinion({ content: 'hello', changelog: 'old' });
    const v2 = makeMinion({ content: 'hello' });
    const result = differ.diff(v1, v2);
    expect(result.removed.some(r => r.field === 'changelog')).toBe(true);
  });

  it('detects changed fields', () => {
    const v1 = makeMinion({ content: 'hello world' });
    const v2 = makeMinion({ content: 'hello universe' });
    const result = differ.diff(v1, v2);
    expect(result.changed.some(c => c.field === 'content')).toBe(true);
  });

  it('formats diff output', () => {
    const v1 = makeMinion({ content: 'line one' });
    const v2 = makeMinion({ content: 'line two' });
    const result = differ.diff(v1, v2);
    const formatted = differ.format(result);
    expect(typeof formatted).toBe('string');
  });
});
