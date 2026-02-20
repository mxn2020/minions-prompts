import { describe, it, expect } from 'vitest';
import { MinionsPrompts, PromptsPlugin } from '../client/index.js';
import { Minions } from 'minions-sdk';

describe('Prompts SDK Client', () => {
    it('should initialize MinionsPrompts and access prompts module', () => {
        const client = new MinionsPrompts();
        expect(client.prompts).toBeDefined();
        expect(client.prompts.renderer).toBeDefined();

        const rendered = client.prompts.renderer.render('hello {{name}}', { name: 'world' });
        expect(rendered).toBe('hello world');
    });

    it('should be mountable as a plugin on core Minions client', () => {
        const minions = new Minions({ plugins: [new PromptsPlugin()] });
        expect((minions as any).prompts).toBeDefined();
        expect((minions as any).prompts.createChain).toBeDefined();

        const chain = (minions as any).prompts.createChain();
        expect(chain).toBeDefined();
    });
});
