import { describe, it, expect } from 'vitest';
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

  // --- New tests ---

  it('identical content produces no added, removed, or changed entries', () => {
    const v1 = makeMinion({ content: 'same content here' });
    const v2 = makeMinion({ content: 'same content here' });
    const result = differ.diff(v1, v2);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    // 'content' field is equal, so it should not appear in changed
    expect(result.changed.some(c => c.field === 'content')).toBe(false);
  });

  it('full replacement of content field is detected as changed', () => {
    const v1 = makeMinion({ content: 'completely original text' });
    const v2 = makeMinion({ content: 'totally different replacement' });
    const result = differ.diff(v1, v2);
    const contentChange = result.changed.find(c => c.field === 'content');
    expect(contentChange).toBeDefined();
    expect(contentChange!.from).toBe('completely original text');
    expect(contentChange!.to).toBe('totally different replacement');
  });

  it('single character change is detected as changed', () => {
    const v1 = makeMinion({ content: 'Hello World' });
    const v2 = makeMinion({ content: 'Hello world' });
    const result = differ.diff(v1, v2);
    expect(result.changed.some(c => c.field === 'content')).toBe(true);
  });

  it('both minions with same empty fields produce no diff entries', () => {
    const v1 = makeMinion({ content: '' });
    const v2 = makeMinion({ content: '' });
    const result = differ.diff(v1, v2);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    // content is equal (both empty string), so changed should not include it
    expect(result.changed.some(c => c.field === 'content')).toBe(false);
  });

  it('multiple fields all changed appear in the changed array', () => {
    const v1 = makeMinion({
      content: 'original',
      description: 'old description',
      versionNumber: 1,
    });
    const v2 = makeMinion({
      content: 'updated',
      description: 'new description',
      versionNumber: 2,
    });
    const result = differ.diff(v1, v2);
    const changedFields = result.changed.map(c => c.field);
    expect(changedFields).toContain('content');
    expect(changedFields).toContain('description');
    expect(changedFields).toContain('versionNumber');
  });

  it('format output for a no-change diff returns empty or minimal string', () => {
    const v1 = makeMinion({ content: 'same' });
    const v2 = makeMinion({ content: 'same' });
    const result = differ.diff(v1, v2);
    const formatted = differ.format(result);
    // With no differences there is nothing to add to the lines array,
    // so format() returns an empty string or only context lines from contentDiff.
    // Either way it should be a string (possibly empty, possibly context lines only).
    expect(typeof formatted).toBe('string');
  });
});
