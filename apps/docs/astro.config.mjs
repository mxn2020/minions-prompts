import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const isProd = process.env.BRANCH === 'main';
const isDev = process.env.BRANCH === 'dev';
const siteUrl = isProd ? 'https://prompts.minions.help' : (isDev ? 'https://prompts.minions.help' : 'http://localhost:4321');

export default defineConfig({
  site: siteUrl,
  integrations: [
    starlight({
      title: 'minions-prompts',
      description: 'GitHub for prompts — version control, testing, and A/B comparison for prompt engineering.',
      components: {
        Head: './src/components/CopyMarkdownButton.astro',
      },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/mxn2020/minions-prompts' }],
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
          label: 'Tutorial',
          items: [
            { label: 'Prompt Engineering Workflow', link: '/tutorial/prompt-engineer/' },
          ],
        },
        {
          label: 'Core Concepts',
          items: [
            { label: 'Prompt Templates & Versions', link: '/concepts/templates-and-versions/' },
            { label: 'Variable Interpolation', link: '/concepts/variables/' },
            { label: 'Version Chains', link: '/concepts/version-chains/' },
            { label: 'Test-Driven Prompt Development', link: '/concepts/testing/' },
            { label: 'Prompt Scoring', link: '/concepts/scoring/' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Writing Effective Tests', link: '/guides/writing-tests/' },
            { label: 'A/B Testing Prompts', link: '/guides/ab-testing/' },
            { label: 'Exporting to LangChain & LlamaIndex', link: '/guides/exporting/' },
            { label: 'Integrating with LangChain & LlamaIndex', link: '/guides/integration/' },
            { label: 'Agent Self-Improvement', link: '/guides/agent-self-improvement/' },
            { label: 'Custom Storage Backends', link: '/guides/storage-backends/' },
            { label: 'Prompt Testing Strategies', link: '/guides/testing-strategies/' },
            { label: 'Migration Guide', link: '/guides/migration/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Field Types', link: '/reference/field-types/' },
            { label: 'Storage Backends', link: '/reference/storage/' },
            { label: 'CLI Reference', link: '/reference/cli/' },
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
