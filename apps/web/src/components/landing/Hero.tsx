import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';

export default function Hero() {
    return (
        <section className="relative overflow-hidden py-24 md:py-36">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center gap-6"
                >
                    <Badge variant="default">v0.1.0 — Open Source</Badge>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary max-w-3xl">
                        GitHub for Prompts
                    </h1>
                    <p className="text-lg md:text-xl text-muted max-w-2xl">
                        Version-controlled, testable, and diffable prompt engineering.
                        Write prompt templates, track every change, run A/B tests, and export to LangChain or LlamaIndex.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <Link to="/playground">
                            <Button size="lg">Open Playground</Button>
                        </Link>
                        <a href="https://github.com/mxn2020/minions-prompts" target="_blank" rel="noreferrer">
                            <Button size="lg" variant="secondary">View on GitHub</Button>
                        </a>
                    </div>
                    <div className="font-mono text-sm text-muted mt-4">
                        <span className="text-muted">$ </span>
                        <span className="text-accent">npm</span>
                        <span> install minions-prompts</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
