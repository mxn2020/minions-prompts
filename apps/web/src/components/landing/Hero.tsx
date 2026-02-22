import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { FileCode2, TestTube2, GitCompare, Terminal } from 'lucide-react';

const featurePills = [
    { icon: FileCode2, label: 'Version Control' },
    { icon: TestTube2, label: 'A/B Testing' },
    { icon: GitCompare, label: 'Diff & Compare' },
];

export default function Hero() {
    return (
        <section className="relative overflow-hidden py-20 md:py-32">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                    {/* Left Side — Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex-1 text-center lg:text-left"
                    >
                        <Badge variant="default">v0.1.0 — Open Source</Badge>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 mt-6 mb-6 leading-tight">
                            GitHub for<br />Prompts
                        </h1>

                        <p className="text-lg md:text-xl text-muted max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                            Version-controlled, testable, and diffable prompt engineering. Write templates, track every change, run A/B tests, and export to LangChain or LlamaIndex.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                            <Link to="/playground">
                                <Button size="lg">Open Playground →</Button>
                            </Link>
                            <a href="https://github.com/mxn2020/minions-prompts" target="_blank" rel="noreferrer">
                                <Button size="lg" variant="secondary">View on GitHub</Button>
                            </a>
                        </div>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                            {featurePills.map((pill) => (
                                <span
                                    key={pill.label}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border text-sm text-muted"
                                >
                                    <pill.icon className="w-3.5 h-3.5 text-accent" />
                                    {pill.label}
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Side — Terminal Install */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex-1 w-full max-w-2xl lg:max-w-none"
                    >
                        <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm shadow-2xl shadow-accent/5 overflow-hidden">
                            {/* Terminal Header */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface/80">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                                </div>
                                <span className="text-xs text-muted ml-2 font-mono">terminal</span>
                            </div>
                            {/* Terminal Content */}
                            <div className="p-6 font-mono text-sm space-y-4 overflow-x-auto whitespace-nowrap">
                                <div className="flex items-start gap-2">
                                    <Terminal className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                                    <div>
                                        <span className="text-muted">$ </span>
                                        <span className="text-accent">npm</span>
                                        <span className="text-primary"> install -g @minions-prompts/cli</span>
                                    </div>
                                </div>
                                <div className="border-t border-border pt-4 flex items-start gap-2">
                                    <Terminal className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                                    <div>
                                        <span className="text-muted">$ </span>
                                        <span className="text-accent">prompts</span>
                                        <span className="text-primary"> diff v1.2.0 v1.3.0</span>
                                    </div>
                                </div>
                                <div className="text-xs space-y-1 bg-background inset-0 p-3 rounded border border-border">
                                    <div className="text-muted">--- a/prompts/customer_support.json</div>
                                    <div className="text-muted">+++ b/prompts/customer_support.json</div>
                                    <div className="text-slate-400">  "system": "You are a helpful assistant.",</div>
                                    <div className="text-error bg-error/10 px-1">- "tone": "formal"</div>
                                    <div className="text-success bg-success/10 px-1">+ "tone": "friendly and concise",</div>
                                    <div className="text-success bg-success/10 px-1">+ "max_tokens": 150</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>

            {/* Background glow effect */}
            <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-accent/8 rounded-full blur-[120px] -z-10 pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
        </section>
    );
}
