import { useState } from 'react';
import { PROMPT_EXAMPLES } from './examples';

export interface PlaygroundPrompt {
  id: string;
  title: string;
  content: string;
  variables: Record<string, string>;
}

export function usePlaygroundState() {
  const [prompts, setPrompts] = useState<PlaygroundPrompt[]>(PROMPT_EXAMPLES);
  const [selectedId, setSelectedId] = useState<string>(PROMPT_EXAMPLES[0]?.id ?? '');
  const [versions, setVersions] = useState<Record<string, PlaygroundPrompt[]>>({});

  const selectedPrompt = prompts.find((p) => p.id === selectedId) ?? null;

  const addPrompt = (prompt: PlaygroundPrompt) => {
    setPrompts((prev) => [...prev, prompt]);
    setSelectedId(prompt.id);
  };

  const updatePrompt = (id: string, updates: Partial<PlaygroundPrompt>) => {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const addVersion = (parentId: string, version: PlaygroundPrompt) => {
    setVersions((prev) => ({
      ...prev,
      [parentId]: [...(prev[parentId] ?? []), version],
    }));
  };

  return {
    prompts,
    selectedId,
    setSelectedId,
    selectedPrompt,
    versions,
    addPrompt,
    updatePrompt,
    addVersion,
  };
}
