interface RendererPreviewProps {
    rendered: string;
}

export function RendererPreview({ rendered }: RendererPreviewProps) {
    return (
        <div className="rounded-lg border border-border bg-surface p-4">
            <span className="text-xs font-mono text-muted block mb-3">Rendered Output</span>
            {rendered ? (
                <pre className="text-sm text-primary whitespace-pre-wrap font-sans leading-relaxed">{rendered}</pre>
            ) : (
                <p className="text-sm text-muted italic">Enter a template and variables to see the rendered prompt.</p>
            )}
        </div>
    );
}
