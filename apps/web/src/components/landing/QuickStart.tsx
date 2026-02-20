import { CodeBlock } from '../shared/CodeBlock';
import { TabGroup } from '../shared/TabGroup';

const tsCode = `import { PromptChain, PromptRenderer } from '@minions-prompts/sdk';

// Create a versioned template
const chain = new PromptChain();
const template = await chain.createTemplate('customer-support', {
  content: 'You are a {{tone}} support agent for {{company}}. Help the user with: {{issue}}',
  variables: [
    { name: 'tone', type: 'select', options: ['friendly', 'formal'] },
    { name: 'company', type: 'string' },
    { name: 'issue', type: 'textarea' },
  ],
});

// Render with variables
const renderer = new PromptRenderer();
const rendered = renderer.render(template.fields.content as string, {
  tone: 'friendly',
  company: 'Acme Corp',
  issue: 'billing question',
});
console.log(rendered);
// → "You are a friendly support agent for Acme Corp. Help the user with: billing question"`;

const pyCode = `from minions_prompts import PromptChain, PromptRenderer

chain = PromptChain()
template = chain.create_template('customer-support', {
    'content': 'You are a {{tone}} support agent for {{company}}.',
    'variables': [
        {'name': 'tone', 'type': 'select', 'options': ['friendly', 'formal']},
        {'name': 'company', 'type': 'string'},
    ],
})

renderer = PromptRenderer()
rendered = renderer.render(template.fields['content'], {
    'tone': 'friendly',
    'company': 'Acme Corp',
})
print(rendered)`;

export default function QuickStart() {
    return (
        <section className="py-24 border-t border-border">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-primary mb-4">Get started in minutes</h2>
                    <p className="text-muted max-w-xl mx-auto">
                        Install, create a template, render with variables — then iterate with full version history.
                    </p>
                </div>
                <div className="max-w-3xl mx-auto">
                    <TabGroup
                        tabs={[
                            { label: 'TypeScript', content: <CodeBlock code={tsCode} language="typescript" title="TypeScript" /> },
                            { label: 'Python', content: <CodeBlock code={pyCode} language="python" title="Python" /> },
                        ]}
                    />
                </div>
            </div>
        </section>
    );
}
