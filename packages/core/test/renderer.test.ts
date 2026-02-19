import { describe, it, expect } from '@jest/globals';
import { PromptRenderer, RendererError } from '../src/PromptRenderer.js';

describe('PromptRenderer', () => {
  const renderer = new PromptRenderer();

  it('substitutes simple variables', () => {
    const result = renderer.render('Hello, {{name}}!', { name: 'World' });
    expect(result).toBe('Hello, World!');
  });

  it('handles multiple variables', () => {
    const result = renderer.render('{{greeting}}, {{name}}!', { greeting: 'Hi', name: 'Alice' });
    expect(result).toBe('Hi, Alice!');
  });

  it('processes #if blocks when truthy', () => {
    const result = renderer.render('Start {{#if show}}middle {{/if}}end', { show: true });
    expect(result).toBe('Start middle end');
  });

  it('omits #if blocks when falsy', () => {
    const result = renderer.render('Start {{#if show}}middle {{/if}}end', { show: false });
    expect(result).toBe('Start end');
  });

  it('processes #each blocks', () => {
    const result = renderer.render('{{#each items}}{{this}} {{/each}}', { items: ['a', 'b', 'c'] });
    expect(result).toBe('a b c ');
  });

  it('throws RendererError for missing required variables', () => {
    expect(() =>
      renderer.render('Hello {{name}}', {}, { requiredVariables: ['name'] })
    ).toThrow(RendererError);
  });

  it('extracts variable names', () => {
    const vars = renderer.extractVariables('Hello {{name}}, you are {{role}}!');
    expect(vars).toContain('name');
    expect(vars).toContain('role');
  });

  it('handles numeric and boolean values', () => {
    const result = renderer.render('Count: {{count}}, Active: {{active}}', { count: 42, active: true });
    expect(result).toBe('Count: 42, Active: true');
  });
});
