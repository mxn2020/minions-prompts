export const PROMPT_EXAMPLES = [
    {
        id: 'example-1',
        title: 'Summarizer',
        content: 'Summarize the following {{topic}} for a {{audience}}:\n\n{{content}}',
        variables: { topic: 'article', audience: 'developer', content: '...' },
    },
    {
        id: 'example-2',
        title: 'Code Reviewer',
        content: 'Review this {{language}} code and provide feedback:\n\n```{{language}}\n{{code}}\n```',
        variables: { language: 'TypeScript', code: 'const x = 1' },
    },
    {
        id: 'example-3',
        title: 'Template v1',
        content: 'You are a helpful assistant. Answer the user question: {{question}}',
        variables: { question: 'What is TypeScript?' },
    },
];

// TypeScript/Python code examples for AnimatedCodeCycler on landing
export const CODE_EXAMPLES = [
    {
        label: 'TypeScript',
        code: `import { PromptRenderer, InMemoryStorage } from '@minions-prompts/sdk';

const storage = new InMemoryStorage();
const renderer = new PromptRenderer();

const result = renderer.render(
  'Hello {{name}}, welcome to {{place}}!',
  { name: 'Alice', place: 'Wonderland' }
);
console.log(result);`,
    },
    {
        label: 'Python',
        code: `from minions_prompts import PromptRenderer, InMemoryStorage

storage = InMemoryStorage()
renderer = PromptRenderer()

result = renderer.render(
    "Hello {{name}}, welcome to {{place}}!",
    {"name": "Alice", "place": "Wonderland"}
)
print(result)`,
    },
];
