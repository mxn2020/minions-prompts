/**
 * Simple Prompt Example
 * Create, render, and export a basic prompt template.
 */

import { createMinion } from 'minions-sdk';
import {
  promptTemplateType,
  PromptRenderer,
  PromptExporter,
  InMemoryStorage,
} from '../../packages/core/src/index.js';

async function main() {
  const storage = new InMemoryStorage();

  // Create a prompt template
  const { minion: template, validation } = createMinion(
    {
      title: 'Blog Post Outline Generator',
      description: 'Generates a structured outline for blog posts on any topic.',
      fields: {
        content: `You are a content strategist. Create a detailed blog post outline for the following:

Topic: {{topic}}
Target audience: {{audience}}
Desired tone: {{tone}}
Approximate length: {{length}} words

{{#if keywords}}
Include these keywords naturally: {{keywords}}
{{/if}}

Format the outline with:
1. A compelling title
2. Introduction hook
3. 3-5 main sections with subpoints
4. Conclusion and call-to-action`,
        variables: ['topic', 'audience', 'tone', 'length', 'keywords'],
        tags: ['content', 'blogging', 'outline'],
      },
    },
    promptTemplateType,
  );

  if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
    process.exit(1);
  }

  await storage.saveMinion(template);
  console.log('✅ Created prompt:', template.id);

  // Render with variables
  const renderer = new PromptRenderer();
  const rendered = renderer.render(template.fields.content as string, {
    topic: 'The Future of Remote Work',
    audience: 'HR professionals and team leads',
    tone: 'professional yet engaging',
    length: '1500',
    keywords: 'hybrid work, employee productivity, company culture',
  });

  console.log('\n📝 Rendered prompt:\n');
  console.log(rendered);

  // Export to LangChain format
  const exporter = new PromptExporter(storage);
  const langchain = await exporter.toLangChain(template.id);
  console.log('\n🔗 LangChain export:\n', JSON.stringify(langchain, null, 2));

  // Export to LlamaIndex format
  const llamaindex = await exporter.toLlamaIndex(template.id);
  console.log('\n🦙 LlamaIndex export:\n', JSON.stringify(llamaindex, null, 2));
}

main().catch(console.error);
