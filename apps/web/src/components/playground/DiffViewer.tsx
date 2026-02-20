interface DiffViewerProps {
    before: string;
    after: string;
}

export function DiffViewer({ before, after }: DiffViewerProps) {
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');

    return (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="border-b border-border px-4 py-2 bg-white/5">
                <span className="text-xs font-mono text-muted">Diff</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border">
                <div className="p-4">
                    <p className="text-xs font-mono text-error mb-2">Before</p>
                    <pre className="text-sm text-muted whitespace-pre-wrap font-mono leading-relaxed">
                        {beforeLines.map((line, i) => (
                            <span key={i} className={line !== afterLines[i] ? 'bg-error/10 text-error block' : 'block'}>{line}</span>
                        ))}
                    </pre>
                </div>
                <div className="p-4">
                    <p className="text-xs font-mono text-success mb-2">After</p>
                    <pre className="text-sm text-muted whitespace-pre-wrap font-mono leading-relaxed">
                        {afterLines.map((line, i) => (
                            <span key={i} className={line !== beforeLines[i] ? 'bg-success/10 text-success block' : 'block'}>{line}</span>
                        ))}
                    </pre>
                </div>
            </div>
        </div>
    );
}
