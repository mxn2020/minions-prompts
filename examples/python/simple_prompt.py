"""
Simple Prompt Example (Python)
Create, render, and export a basic prompt template.
"""

from minions import create_minion
from minions_prompts import (
    prompt_template_type,
    PromptRenderer,
    PromptExporter,
    InMemoryStorage,
)

def main():
    storage = InMemoryStorage()

    # Create a prompt template
    template, validation = create_minion(
        {
            "title": "Blog Post Outline Generator",
            "description": "Generates a structured outline for blog posts on any topic.",
            "fields": {
                "content": (
                    "You are a content strategist. Create a detailed blog post outline for:\n\n"
                    "Topic: {{topic}}\n"
                    "Target audience: {{audience}}\n"
                    "Desired tone: {{tone}}\n"
                    "Approximate length: {{length}} words\n\n"
                    "{{#if keywords}}\n"
                    "Include these keywords naturally: {{keywords}}\n"
                    "{{/if}}\n\n"
                    "Format the outline with:\n"
                    "1. A compelling title\n"
                    "2. Introduction hook\n"
                    "3. 3-5 main sections with subpoints\n"
                    "4. Conclusion and call-to-action"
                ),
                "variables": ["topic", "audience", "tone", "length", "keywords"],
                "tags": ["content", "blogging", "outline"],
            },
        },
        prompt_template_type,
    )

    storage.save_minion(template)
    print(f"✅ Created prompt: {template.id}")

    # Render with variables
    renderer = PromptRenderer()
    rendered = renderer.render(
        template.fields["content"],
        {
            "topic": "The Future of Remote Work",
            "audience": "HR professionals and team leads",
            "tone": "professional yet engaging",
            "length": "1500",
            "keywords": "hybrid work, employee productivity, company culture",
        },
    )
    print("\n📝 Rendered prompt:\n")
    print(rendered)

    # Export
    exporter = PromptExporter(storage)
    langchain_export = exporter.to_lang_chain(template.id)
    print("\n🔗 LangChain export:")
    print(f"  template: {langchain_export.template[:60]}...")
    print(f"  input_variables: {langchain_export.input_variables}")

    llamaindex_export = exporter.to_llama_index(template.id)
    print("\n🦙 LlamaIndex export:")
    print(f"  template_vars: {llamaindex_export.template_vars}")


if __name__ == "__main__":
    main()
