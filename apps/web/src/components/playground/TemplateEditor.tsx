import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';

interface TemplateEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export function TemplateEditor({ value, onChange }: TemplateEditorProps) {
    return (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="border-b border-border px-4 py-2 bg-white/5">
                <span className="text-xs font-mono text-muted">Prompt Template</span>
            </div>
            <CodeMirror
                value={value}
                extensions={[json()]}
                onChange={onChange}
                theme="dark"
                basicSetup={{ lineNumbers: true, foldGutter: false }}
                className="text-sm font-mono [&_.cm-editor]:bg-transparent [&_.cm-gutters]:bg-transparent min-h-[200px]"
            />
        </div>
    );
}
