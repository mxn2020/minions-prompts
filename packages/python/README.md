# minions-prompts (Python)

Python SDK for the minions-prompts version-controlled prompt engineering system.

## Installation

```bash
pip install minions-prompts
```

## Quick Start

```python
from minions import create_minion
from minions_prompts import (
    prompt_template_type, prompt_version_type,
    PromptRenderer, PromptChain, PromptDiff,
    InMemoryStorage, register_prompt_types,
)

storage = InMemoryStorage()

# Create a prompt template
minion, _ = create_minion(
    {"title": "Summarizer", "fields": {"content": "Summarize {{topic}} for {{audience}}."}},
    prompt_template_type,
)
storage.save_minion(minion)

# Render it
renderer = PromptRenderer()
rendered = renderer.render(
    minion.fields["content"],
    {"topic": "AI agents", "audience": "developers"},
)
print(rendered)
```
