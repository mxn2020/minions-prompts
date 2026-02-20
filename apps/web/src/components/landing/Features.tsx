import { motion } from 'framer-motion';
import { GitBranch, FlaskConical, Diff, Download, Bot, Search } from 'lucide-react';

const features = [
    {
        icon: GitBranch,
        title: 'Version Chains',
        description: 'Every prompt edit creates a new version linked to its predecessor. Traverse history, branch, and roll back at any time.',
    },
    {
        icon: Diff,
        title: 'Prompt Diff',
        description: 'Side-by-side character-level diff between any two prompt versions. See exactly what changed and why.',
    },
    {
        icon: FlaskConical,
        title: 'A/B Testing',
        description: 'Run the same input through two prompt versions and compare outputs. Track scores, latency, and token counts.',
    },
    {
        icon: Search,
        title: 'Variable Interpolation',
        description: 'Define typed variables (string, number, boolean, select) and render prompts with real or test data instantly.',
    },
    {
        icon: Download,
        title: 'Export Anywhere',
        description: 'Export prompt templates to LangChain, LlamaIndex, or raw JSON. Works with any AI framework.',
    },
    {
        icon: Bot,
        title: 'Agent Self-Improvement',
        description: 'Agents can propose and commit new prompt versions, enabling automated prompt optimization loops.',
    },
];

export default function Features() {
    return (
        <section className="py-24 border-t border-border">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-primary mb-4">Everything you need for prompt engineering</h2>
                    <p className="text-muted max-w-xl mx-auto">
                        Built on the minions structured object system — every prompt template, version, test, and result is a typed, queryable Minion.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="rounded-xl border border-border bg-surface p-6 flex flex-col gap-4"
                        >
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                                <feature.icon className="w-5 h-5 text-accent" />
                            </div>
                            <h3 className="text-lg font-semibold text-primary">{feature.title}</h3>
                            <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
