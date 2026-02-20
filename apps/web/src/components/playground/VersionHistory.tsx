interface Version {
    id: string;
    label: string;
    createdAt: string;
}

interface VersionHistoryProps {
    versions: Version[];
    activeId?: string;
    onSelect: (id: string) => void;
}

export function VersionHistory({ versions, activeId, onSelect }: VersionHistoryProps) {
    return (
        <div className="rounded-lg border border-border bg-surface p-4">
            <span className="text-xs font-mono text-muted block mb-3">Version History</span>
            {versions.length === 0 ? (
                <p className="text-sm text-muted">No versions yet. Save a template to start tracking.</p>
            ) : (
                <ul className="space-y-2">
                    {versions.map(v => (
                        <li key={v.id}>
                            <button
                                onClick={() => onSelect(v.id)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                    v.id === activeId
                                        ? 'bg-accent/10 text-accent border border-accent/20'
                                        : 'text-muted hover:text-primary hover:bg-white/5'
                                }`}
                            >
                                <span className="font-mono">{v.label}</span>
                                <span className="block text-xs text-muted mt-0.5">{new Date(v.createdAt).toLocaleString()}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
