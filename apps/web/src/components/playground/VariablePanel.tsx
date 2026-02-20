interface Variable {
    name: string;
    value: string;
}

interface VariablePanelProps {
    variables: Variable[];
    onChange: (variables: Variable[]) => void;
}

export function VariablePanel({ variables, onChange }: VariablePanelProps) {
    const update = (index: number, value: string) => {
        const next = variables.map((v, i) => i === index ? { ...v, value } : v);
        onChange(next);
    };

    if (variables.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-sm text-muted">No variables detected. Use &#123;&#123;varName&#125;&#125; in your template.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <span className="text-xs font-mono text-muted block mb-2">Variables</span>
            {variables.map((v, i) => (
                <div key={v.name} className="flex items-center gap-3">
                    <label className="text-sm font-mono text-accent w-32 shrink-0">{v.name}</label>
                    <input
                        type="text"
                        value={v.value}
                        onChange={e => update(i, e.target.value)}
                        placeholder={`Value for ${v.name}`}
                        className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                </div>
            ))}
        </div>
    );
}
