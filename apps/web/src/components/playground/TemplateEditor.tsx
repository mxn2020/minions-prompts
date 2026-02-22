import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { HelpCircle } from 'lucide-react';

interface TemplateEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export function TemplateEditor({ value, onChange }: TemplateEditorProps) {
    return (
        <>
            <div className="h-10 flex items-center justify-between px-4 bg-[#121212] border-b border-border shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Template Editor</span>
                    <div className="flex bg-surface rounded p-0.5">
                        <button className="px-2 py-0.5 text-xs text-background bg-accent rounded font-medium shadow-sm">Edit</button>
                        <button className="px-2 py-0.5 text-xs text-muted hover:text-primary transition-colors">Preview</button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted">Markdown Supported</span>
                    <button className="text-muted hover:text-accent transition-colors">
                        <HelpCircle className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="flex-1 relative overflow-auto bg-background">
                <CodeMirror
                    value={value}
                    extensions={[json(), EditorView.lineWrapping]}
                    onChange={onChange}
                    theme="dark"
                    basicSetup={{
                        lineNumbers: true,
                        foldGutter: false,
                        highlightActiveLine: true,
                        highlightActiveLineGutter: true
                    }}
                    className="h-full text-sm font-mono [&_.cm-editor]:h-full [&_.cm-editor]:bg-transparent [&_.cm-gutters]:bg-[#121212] [&_.cm-gutters]:border-r [&_.cm-gutters]:border-border [&_.cm-gutters]:text-muted [&_.cm-gutterElement]:opacity-50 [&_.cm-activeLineGutter]:bg-surface/50 [&_.cm-activeLine]:bg-white/[0.02]"
                />
            </div>
        </>
    );
}
