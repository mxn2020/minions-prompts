import { Minions } from 'minions-sdk';
import { PromptsPlugin } from './PromptsPlugin.js';

/**
 * Standalone Central Client for the Prompts SDK.
 * Inherits from `Minions` and automatically includes the `PromptsPlugin`.
 */
export class MinionsPrompts extends Minions {
    // We specify the plugin type explicitly for TS autocomplete support
    declare public prompts: ReturnType<PromptsPlugin['init']>;

    constructor() {
        super({ plugins: [new PromptsPlugin()] });
    }
}
