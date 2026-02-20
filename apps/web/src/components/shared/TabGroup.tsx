import React, { useState } from 'react';

interface Tab {
    label: string;
    content: React.ReactNode;
}

interface TabGroupProps {
    tabs: Tab[];
    className?: string;
}

export function TabGroup({ tabs, className = '' }: TabGroupProps) {
    const [active, setActive] = useState(0);

    return (
        <div className={className}>
            <div className="flex border-b border-border">
                {tabs.map((tab, i) => (
                    <button
                        key={tab.label}
                        onClick={() => setActive(i)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            active === i
                                ? 'text-primary border-b-2 border-accent -mb-px'
                                : 'text-muted hover:text-primary'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="pt-4">{tabs[active]?.content}</div>
        </div>
    );
}
