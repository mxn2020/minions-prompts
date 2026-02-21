import { describe, it, expect } from 'vitest';
import { PromptRenderer, RendererError } from '../PromptRenderer.js';

describe('PromptRenderer', () => {
    const renderer = new PromptRenderer();

    describe('render()', () => {
        it('should substitute simple variables', () => {
            const result = renderer.render('Hello, {{name}}!', { name: 'Alice' });
            expect(result).toBe('Hello, Alice!');
        });

        it('should substitute multiple variables', () => {
            const result = renderer.render(
                '{{greeting}}, {{name}}! You are a {{role}}.',
                { greeting: 'Hi', name: 'Bob', role: 'developer' },
            );
            expect(result).toBe('Hi, Bob! You are a developer.');
        });

        it('should handle numeric values', () => {
            const result = renderer.render('Count: {{count}}', { count: 42 });
            expect(result).toBe('Count: 42');
        });

        it('should handle object values as JSON', () => {
            const result = renderer.render('Data: {{data}}', { data: { key: 'value' } });
            expect(result).toBe('Data: {"key":"value"}');
        });

        it('should handle null and undefined values as empty strings', () => {
            const result = renderer.render('A: {{a}}, B: {{b}}', { a: null, b: undefined });
            expect(result).toBe('A: , B: ');
        });

        it('should leave unknown variables as-is in strict mode', () => {
            const result = renderer.render('Hello, {{unknown}}!', {});
            expect(result).toBe('Hello, {{unknown}}!');
        });

        it('should throw on missing required variables', () => {
            expect(() =>
                renderer.render('Hello, {{name}}!', {}, { requiredVariables: ['name'] }),
            ).toThrow(RendererError);
        });

        it('should include missing variable names in error', () => {
            try {
                renderer.render('{{a}} {{b}}', {}, { requiredVariables: ['a', 'b'] });
            } catch (e) {
                expect(e).toBeInstanceOf(RendererError);
                expect((e as RendererError).missingVariables).toEqual(['a', 'b']);
            }
        });

        it('should not throw for provided required variables', () => {
            const result = renderer.render('Hello, {{name}}!', { name: 'Alice' }, { requiredVariables: ['name'] });
            expect(result).toBe('Hello, Alice!');
        });
    });

    describe('#if blocks', () => {
        it('should render block when condition is truthy', () => {
            const result = renderer.render(
                '{{#if showGreeting}}Hello!{{/if}}',
                { showGreeting: true },
            );
            expect(result).toBe('Hello!');
        });

        it('should hide block when condition is falsy', () => {
            const result = renderer.render(
                '{{#if showGreeting}}Hello!{{/if}}',
                { showGreeting: false },
            );
            expect(result).toBe('');
        });

        it('should treat empty string as falsy', () => {
            const result = renderer.render(
                '{{#if name}}Hi {{name}}{{/if}}',
                { name: '' },
            );
            expect(result).toBe('');
        });

        it('should treat empty array as falsy', () => {
            const result = renderer.render(
                '{{#if items}}Has items{{/if}}',
                { items: [] },
            );
            expect(result).toBe('');
        });

        it('should treat non-empty array as truthy', () => {
            const result = renderer.render(
                '{{#if items}}Has items{{/if}}',
                { items: [1] },
            );
            expect(result).toBe('Has items');
        });
    });

    describe('#each blocks', () => {
        it('should iterate over primitive arrays', () => {
            const result = renderer.render(
                '{{#each items}}{{this}}, {{/each}}',
                { items: ['a', 'b', 'c'] },
            );
            expect(result).toBe('a, b, c, ');
        });

        it('should iterate over object arrays', () => {
            const result = renderer.render(
                '{{#each users}}{{name}} ({{role}})\n{{/each}}',
                { users: [{ name: 'Alice', role: 'admin' }, { name: 'Bob', role: 'user' }] },
            );
            expect(result).toContain('Alice (admin)');
            expect(result).toContain('Bob (user)');
        });

        it('should return empty for undefined collection', () => {
            const result = renderer.render('{{#each items}}{{this}}{{/each}}', {});
            expect(result).toBe('');
        });

        it('should return empty for non-array value', () => {
            const result = renderer.render('{{#each items}}{{this}}{{/each}}', { items: 'not-array' });
            expect(result).toBe('');
        });
    });

    describe('extractVariables()', () => {
        it('should extract simple variables', () => {
            const vars = renderer.extractVariables('Hello, {{name}}! Your role is {{role}}.');
            expect(vars).toContain('name');
            expect(vars).toContain('role');
        });

        it('should extract variables from #if blocks', () => {
            const vars = renderer.extractVariables('{{#if showBio}}Bio: {{bio}}{{/if}}');
            expect(vars).toContain('showBio');
            expect(vars).toContain('bio');
        });

        it('should extract collection names from #each blocks', () => {
            const vars = renderer.extractVariables('{{#each items}}{{this}}{{/each}}');
            expect(vars).toContain('items');
        });

        it('should deduplicate repeated variables', () => {
            const vars = renderer.extractVariables('{{name}} says: {{name}}');
            expect(vars.filter(v => v === 'name')).toHaveLength(1);
        });

        it('should return empty for template without variables', () => {
            const vars = renderer.extractVariables('Hello, world!');
            expect(vars).toHaveLength(0);
        });
    });
});
