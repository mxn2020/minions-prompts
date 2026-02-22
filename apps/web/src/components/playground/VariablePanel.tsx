import { Plus, ChevronDown } from 'lucide-react';

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

    return (
        <>
            <div className="p-3 border-b border-border bg-[#121212]">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Variables</h3>
                <p className="text-[10px] text-muted">Manage input values for testing.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {variables.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-sm text-muted">No variables detected.<br />Use &#123;&#123;varName&#125;&#125; in your template.</p>
                    </div>
                ) : (
                    variables.map((v, i) => (
                        <div key={v.name} className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-accent flex justify-between">
                                {v.name}
                                <span className="text-[10px] text-muted opacity-60">String</span>
                            </label>
                            <input
                                type="text"
                                value={v.value}
                                onChange={e => update(i, e.target.value)}
                                placeholder={`Value for ${v.name}`}
                                className="bg-surface border border-border rounded text-sm text-primary px-3 py-2 w-full focus:ring-1 focus:ring-accent focus:border-accent outline-none placeholder:text-muted font-mono transition-colors"
                            />
                        </div>
                    ))
                )}

                <div className="pt-4 mt-2 border-t border-border">
                    <button className="w-full py-2 border border-dashed border-muted/50 rounded text-xs text-muted hover:text-accent hover:border-accent transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-3.5 h-3.5" />
                        Add New Variable
                    </button>
                </div>
            </div>

            <div className="p-3 border-t border-border bg-[#121212]">
                <div className="flex justify-between items-center text-xs text-muted mb-2">
                    <span>Model Configuration</span>
                </div>
                <div className="flex gap-2 mb-2">
                    <span className="px-2 py-1 bg-surface rounded text-[10px] text-primary border border-border flex items-center gap-1">
                        GPT-4 <ChevronDown className="w-2.5 h-2.5" />
                    </span>
                    <span className="px-2 py-1 bg-surface rounded text-[10px] text-primary border border-border">
                        Temp: 0.7
                    </span>
                </div>
                <button className="text-[10px] text-accent hover:underline">Configure Model Options</button>
            </div>
        </>
    );
}
