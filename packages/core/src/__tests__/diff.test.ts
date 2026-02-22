import { describe, it, expect } from 'vitest';
import { PromptDiff } from '../PromptDiff.js';
import type { Minion } from 'minions-sdk';
import { generateId, now } from 'minions-sdk';

function makeMinion(fields: Record<string, unknown>, overrides?: Partial<Minion>): Minion {
    return {
        id: generateId(),
        title: 'Test Prompt',
        minionTypeId: 'prompt-type',
        fields,
        tags: [],
        createdAt: now(),
        updatedAt: now(),
        ...overrides,
    };
}

describe('PromptDiff', () => {
    const differ = new PromptDiff();

    describe('diff()', () => {
        it('should detect added fields', () => {
            const v1 = makeMinion({ content: 'Hello' });
            const v2 = makeMinion({ content: 'Hello', maxTokens: 100 });

            const result = differ.diff(v1, v2);

            expect(result.added).toHaveLength(1);
            expect(result.added[0]!.field).toBe('maxTokens');
            expect(result.added[0]!.value).toBe(100);
        });

        it('should detect removed fields', () => {
            const v1 = makeMinion({ content: 'Hello', maxTokens: 100 });
            const v2 = makeMinion({ content: 'Hello' });

            const result = differ.diff(v1, v2);

            expect(result.removed).toHaveLength(1);
            expect(result.removed[0]!.field).toBe('maxTokens');
        });

        it('should detect changed fields', () => {
            const v1 = makeMinion({ content: 'Hello {{name}}', temperature: 0.5 });
            const v2 = makeMinion({ content: 'Hi {{name}}', temperature: 0.8 });

            const result = differ.diff(v1, v2);

            const contentChange = result.changed.find(c => c.field === 'content');
            expect(contentChange).toBeDefined();
            expect(contentChange!.from).toBe('Hello {{name}}');
            expect(contentChange!.to).toBe('Hi {{name}}');

            const tempChange = result.changed.find(c => c.field === 'temperature');
            expect(tempChange).toBeDefined();
            expect(tempChange!.from).toBe(0.5);
            expect(tempChange!.to).toBe(0.8);
        });

        it('should detect title changes', () => {
            const v1 = makeMinion({}, { title: 'Summarizer v1' });
            const v2 = makeMinion({}, { title: 'Summarizer v2' });

            const result = differ.diff(v1, v2);

            const titleChange = result.changed.find(c => c.field === 'title');
            expect(titleChange).toBeDefined();
            expect(titleChange!.from).toBe('Summarizer v1');
            expect(titleChange!.to).toBe('Summarizer v2');
        });

        it('should return empty diff for identical minions', () => {
            const fields = { content: 'Hello', temperature: 0.7 };
            const v1 = makeMinion(fields, { title: 'Same' });
            const v2 = makeMinion(fields, { title: 'Same' });

            const result = differ.diff(v1, v2);

            expect(result.added).toHaveLength(0);
            expect(result.removed).toHaveLength(0);
            expect(result.changed).toHaveLength(0);
        });

        it('should produce content line-level diff', () => {
            const v1 = makeMinion({ content: 'Line 1\nLine 2\nLine 3' });
            const v2 = makeMinion({ content: 'Line 1\nLine 2 modified\nLine 3\nLine 4' });

            const result = differ.diff(v1, v2);

            expect(result.contentDiff).toBeDefined();
            expect(result.contentDiff!.length).toBeGreaterThan(0);

            const addedLines = result.contentDiff!.filter(l => l.type === 'add');
            const removedLines = result.contentDiff!.filter(l => l.type === 'remove');
            expect(addedLines.length).toBeGreaterThan(0);
            expect(removedLines.length).toBeGreaterThan(0);
        });
    });

    describe('format()', () => {
        it('should format a diff result as a readable string', () => {
            const v1 = makeMinion({ content: 'Hello', maxTokens: 100 }, { title: 'v1' });
            const v2 = makeMinion({ content: 'Hi', temperature: 0.7 }, { title: 'v2' });

            const result = differ.diff(v1, v2);
            const formatted = differ.format(result);

            expect(formatted).toContain('temperature');
            expect(formatted).toContain('maxTokens');
        });

        it('should produce non-empty output for non-trivial diff', () => {
            const v1 = makeMinion({ content: 'A\nB\nC' });
            const v2 = makeMinion({ content: 'A\nX\nC' });

            const result = differ.diff(v1, v2);
            const formatted = differ.format(result);

            expect(formatted.length).toBeGreaterThan(0);
        });
    });
});
