import type { Minions, MinionPlugin } from 'minions-sdk';
import { PromptRenderer } from '../PromptRenderer.js';
import { PromptChain } from '../PromptChain.js';
import { PromptDiff } from '../PromptDiff.js';
import { PromptScorer } from '../PromptScorer.js';
import { PromptExporter } from '../PromptExporter.js';
import { InMemoryStorage } from '../InMemoryStorage.js';
import { registerPromptTypes } from '../schemas.js';

/**
 * MinionPlugin implementation that mounts Prompts capabilities onto the core Minions client.
 */
export class PromptsPlugin implements MinionPlugin {
    namespace = 'prompts';

    init(core: Minions) {
        // Register prompt types in the core registry
        registerPromptTypes(core.registry);

        // Default storage
        const storage = new InMemoryStorage();

        // Provide instances or factories accessible under `minions.prompts`
        return {
            renderer: new PromptRenderer(),
            diff: new PromptDiff(),
            scorer: new PromptScorer(storage),
            exporter: new PromptExporter(storage),
            storage,

            // Factory for PromptChain
            createChain: () => new PromptChain(storage)
        };
    }
}
