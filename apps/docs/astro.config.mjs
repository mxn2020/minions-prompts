import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'minions-prompts',
      description: 'GitHub for prompts — version control, testing, and A/B comparison for prompt engineering.',
      social: {
        github: 'https://github.com/mxn2020/minions-prompts',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/' },
            { label: 'Installation', link: '/getting-started/installation/' },
            { label: 'Quick Start', link: '/getting-started/quick-start/' },
          ],
        },
        {
          label: 'Core Concepts',
          items: [
            { label: 'Prompt Templates & Versions', link: '/concepts/templates-and-versions/' },
            { label: 'Variable Interpolation', link: '/concepts/variables/' },
            { label: 'Version Chains', link: '/concepts/version-chains/' },
            { label: 'Test-Driven Prompt Development', link: '/concepts/testing/' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Writing Effective Tests', link: '/guides/writing-tests/' },
            { label: 'A/B Testing Prompts', link: '/guides/ab-testing/' },
            { label: 'Exporting to LangChain & LlamaIndex', link: '/guides/exporting/' },
            { label: 'Agent Self-Improvement', link: '/guides/agent-self-improvement/' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'TypeScript', link: '/api/typescript/' },
            { label: 'Python', link: '/api/python/' },
          ],
        },
        {
          label: 'CLI Reference',
          link: '/cli/',
        },
      ],
    }),
  ],
});
