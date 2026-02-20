import { Link } from 'react-router-dom';
import { Button } from '../shared/Button';

export default function CTABanner() {
    return (
        <section className="py-24 border-t border-border">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <h2 className="text-3xl font-bold text-primary mb-4">
                    Start versioning your prompts today
                </h2>
                <p className="text-muted max-w-lg mx-auto mb-8">
                    Open the playground to create templates, render variables, diff versions, and run tests — all in the browser.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/playground">
                        <Button size="lg">Open Playground</Button>
                    </Link>
                    <a href="https://github.com/mxn2020/minions-prompts" target="_blank" rel="noreferrer">
                        <Button size="lg" variant="secondary">View Source</Button>
                    </a>
                </div>
            </div>
        </section>
    );
}
