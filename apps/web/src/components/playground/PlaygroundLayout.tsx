import { useState, useCallback } from 'react';
import { TemplateEditor } from './TemplateEditor';
import { VariablePanel } from './VariablePanel';
import { RendererPreview } from './RendererPreview';
import { VersionHistory } from './VersionHistory';
import { DiffViewer } from './DiffViewer';
import { Button } from '../shared/Button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Download, Play, CheckCircle, Circle } from 'lucide-react';

interface Variable {
    name: string;
    value: string;
}

interface Version {
    id: string;
    label: string;
    content: string;
    createdAt: string;
}

const INITIAL_TEMPLATE = 'You are a {{tone}} assistant for {{company}}. Help the user with: {{task}}';

function extractVariables(template: string): Variable[] {
    const matches = template.match(/\{\{(\w+)\}\}/g) ?? [];
    const names = [...new Set(matches.map(m => m.slice(2, -2)))];
    return names.map(name => ({ name, value: '' }));
}

function renderTemplate(template: string, variables: Variable[]): string {
    return variables.reduce((t, v) => t.replaceAll(`{{${v.name}}}`, v.value || `[${v.name}]`), template);
}

export function PlaygroundLayout() {
    const [template, setTemplate] = useState(INITIAL_TEMPLATE);
    const [variables, setVariables] = useState<Variable[]>(extractVariables(INITIAL_TEMPLATE));
    const [versions, setVersions] = useState<Version[]>([]);
    const [activeVersionId, setActiveVersionId] = useState<string | undefined>();
    const [showDiff, setShowDiff] = useState(false);

    const handleTemplateChange = useCallback((val: string) => {
        setTemplate(val);
        setVariables(prev => {
            const newVars = extractVariables(val);
            return newVars.map(nv => ({
                name: nv.name,
                value: prev.find(p => p.name === nv.name)?.value ?? '',
            }));
        });
    }, []);

    const saveVersion = useCallback(() => {
        const version: Version = {
            id: crypto.randomUUID(),
            label: `v${versions.length + 1}`,
            content: template,
            createdAt: new Date().toISOString(),
        };
        setVersions(prev => [version, ...prev]);
        setActiveVersionId(version.id);
    }, [template, versions.length]);

    const loadVersion = useCallback((id: string) => {
        const version = versions.find(v => v.id === id);
        if (version) {
            setTemplate(version.content);
            setActiveVersionId(id);
        }
    }, [versions]);

    const rendered = renderTemplate(template, variables);
    const activeVersion = versions.find(v => v.id === activeVersionId);
    const prevVersion = activeVersionId ? versions[versions.findIndex(v => v.id === activeVersionId) + 1] : undefined;

    return (
        <div className="flex flex-col h-screen bg-background text-primary overflow-hidden">
            {/* Header */}
            <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-[#121212] shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-muted hover:text-primary transition-colors text-sm group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    </Link>
                    <div className="flex items-center gap-2 text-accent">
                        <span className="font-bold tracking-tight text-lg text-primary">minions-prompts</span>
                    </div>
                    {/* Breadcrumbs */}
                    <div className="hidden md:flex items-center gap-2 text-sm text-muted border-l border-border pl-4 h-6">
                        <span className="hover:text-primary cursor-pointer transition-colors">Workspace</span>
                        <span className="text-xs">›</span>
                        <span className="text-primary font-medium">prompt-template</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-accent/20 text-accent font-mono ml-1">
                            {activeVersion ? activeVersion.label : 'draft'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Diff Toggle */}
                    <div className="flex items-center gap-2 mr-2">
                        <label className="text-xs font-medium text-muted cursor-pointer select-none" htmlFor="diff-toggle">
                            Diff View
                        </label>
                        <button
                            onClick={() => setShowDiff(!showDiff)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${showDiff ? 'bg-accent/50' : 'bg-surface'}`}
                        >
                            <span className={`absolute top-0.5 size-4 bg-white rounded-full shadow-sm transition-all ${showDiff ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                    </div>
                    {/* Actions */}
                    <button onClick={saveVersion} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border hover:bg-surface text-sm font-medium transition-colors text-primary">
                        <Save className="w-3.5 h-3.5" />
                        Save
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border hover:bg-surface text-sm font-medium transition-colors text-primary">
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-accent hover:bg-accent-hover text-background text-sm font-bold shadow-lg shadow-accent/10 transition-colors">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Run
                    </button>
                </div>
            </header>

            {/* Main 3-Panel Layout */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Version History */}
                <aside className="w-64 flex flex-col border-r border-border bg-[#121212] shrink-0">
                    <VersionHistory versions={versions} activeId={activeVersionId} onSelect={loadVersion} />
                </aside>

                {/* Center: Editor + Output Console */}
                <div className="flex-1 flex flex-col min-w-0 bg-background">
                    {/* Editor Pane */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <TemplateEditor value={template} onChange={handleTemplateChange} />
                    </div>

                    {/* Divider */}
                    <div className="h-1 bg-border hover:bg-accent cursor-row-resize transition-colors w-full" />

                    {/* Bottom Panel: Output Console */}
                    <div className="h-64 flex flex-col bg-[#121212] border-t border-border shrink-0">
                        <div className="h-9 px-4 flex items-center justify-between border-b border-border bg-surface/30">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-success" />
                                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                                    {showDiff ? 'Diff View' : 'Output Console'}
                                </h3>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {showDiff ? (
                                <DiffViewer
                                    before={prevVersion?.content ?? ''}
                                    after={activeVersion?.content ?? template}
                                />
                            ) : (
                                <RendererPreview rendered={rendered} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Variables */}
                <aside className="w-80 flex flex-col border-l border-border bg-[#121212] shrink-0">
                    <VariablePanel variables={variables} onChange={setVariables} />
                </aside>
            </main>

            {/* Status Bar */}
            <footer className="h-6 bg-accent/5 border-t border-border flex items-center justify-between px-4 text-[10px] text-muted shrink-0 select-none">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1 hover:text-primary cursor-pointer">
                        <Save className="w-2.5 h-2.5" />
                        <span>Auto-saved</span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-primary cursor-pointer">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>No issues found</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <span>UTF-8</span>
                    <div className="flex items-center gap-1 text-accent">
                        <Circle className="w-1.5 h-1.5 fill-current" />
                        <span>Connected</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
