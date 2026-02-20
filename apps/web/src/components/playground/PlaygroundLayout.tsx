import { useState, useCallback } from 'react';
import { TemplateEditor } from './TemplateEditor';
import { VariablePanel } from './VariablePanel';
import { RendererPreview } from './RendererPreview';
import { VersionHistory } from './VersionHistory';
import { DiffViewer } from './DiffViewer';
import { TabGroup } from '../shared/TabGroup';
import { Button } from '../shared/Button';

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
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-primary">Prompt Playground</h1>
                <Button onClick={saveVersion} size="sm">Save Version</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <TemplateEditor value={template} onChange={handleTemplateChange} />
                    <VariablePanel variables={variables} onChange={setVariables} />
                </div>
                <div className="flex flex-col gap-4">
                    <VersionHistory versions={versions} activeId={activeVersionId} onSelect={loadVersion} />
                </div>
            </div>

            <TabGroup
                tabs={[
                    {
                        label: 'Preview',
                        content: <RendererPreview rendered={rendered} />,
                    },
                    {
                        label: 'Diff',
                        content: (
                            <DiffViewer
                                before={prevVersion?.content ?? ''}
                                after={activeVersion?.content ?? template}
                            />
                        ),
                    },
                ]}
            />
        </div>
    );
}
