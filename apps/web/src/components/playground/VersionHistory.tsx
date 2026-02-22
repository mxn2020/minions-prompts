import { Filter } from 'lucide-react';

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
        <>
            <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider">History</h3>
                <button className="text-muted hover:text-primary p-1 rounded hover:bg-surface transition-colors">
                    <Filter className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                {versions.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                        <p className="text-sm text-muted">No versions yet. Save a template to start tracking.</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {versions.map(v => {
                            const isActive = v.id === activeId;
                            return (
                                <button
                                    key={v.id}
                                    onClick={() => onSelect(v.id)}
                                    className={`group flex flex-col gap-1 px-4 py-2.5 text-left transition-colors border-l-2 ${isActive
                                            ? 'bg-surface border-accent'
                                            : 'border-transparent hover:bg-surface/50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <span className={`text-sm font-mono ${isActive ? 'text-accent' : 'text-muted group-hover:text-primary'}`}>
                                            {v.label}
                                        </span>
                                        <span className="text-[10px] text-muted whitespace-nowrap ml-2">
                                            {new Date(v.createdAt).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate w-full ${isActive ? 'text-primary' : 'text-muted'}`}>
                                        Saved version {v.label}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
