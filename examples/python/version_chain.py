"""
Version Chain Example (Python)
Create a prompt, bump versions, view history, and show diffs.
"""

from minions import create_minion, generate_id, now, Relation
from minions_prompts import (
    prompt_template_type,
    prompt_version_type,
    PromptChain,
    PromptDiff,
    InMemoryStorage,
)


def main():
    storage = InMemoryStorage()

    # Create original template
    template, _ = create_minion(
        {
            "title": "Code Review Assistant",
            "fields": {
                "content": "Review the following code and identify issues:\n\n{{code}}",
                "variables": ["code"],
            },
        },
        prompt_template_type,
    )
    storage.save_minion(template)

    # Version 2: Add language context
    v2, _ = create_minion(
        {
            "title": "Code Review Assistant v2",
            "fields": {
                "content": (
                    "Review the following {{language}} code and identify:\n"
                    "1. Bugs and potential runtime errors\n"
                    "2. Security vulnerabilities\n"
                    "3. Performance issues\n"
                    "4. Style violations\n\n"
                    "Code:\n```{{language}}\n{{code}}\n```"
                ),
                "versionNumber": 2,
                "changelog": "Added language context and structured review categories",
                "variables": ["language", "code"],
            },
        },
        prompt_version_type,
    )
    storage.save_minion(v2)
    storage.save_relation(Relation(
        id=generate_id(),
        source_id=v2.id,
        target_id=template.id,
        type="follows",
        created_at=now(),
    ))

    # Version 3: Add severity levels
    v3, _ = create_minion(
        {
            "title": "Code Review Assistant v3",
            "fields": {
                "content": (
                    "You are an expert {{language}} developer performing a thorough code review.\n\n"
                    "For each issue found, assign a severity: 🔴 Critical | 🟡 Warning | 🔵 Suggestion\n\n"
                    "{{#if standards}}\n"
                    "Also check compliance with: {{standards}}\n"
                    "{{/if}}\n\n"
                    "Code:\n```{{language}}\n{{code}}\n```\n\n"
                    "Provide actionable recommendations for each issue."
                ),
                "versionNumber": 3,
                "changelog": "Added severity levels and conditional standards check",
                "variables": ["language", "code", "standards"],
            },
        },
        prompt_version_type,
    )
    storage.save_minion(v3)
    storage.save_relation(Relation(
        id=generate_id(),
        source_id=v3.id,
        target_id=v2.id,
        type="follows",
        created_at=now(),
    ))

    # View version chain
    chain = PromptChain(storage)
    versions = chain.get_version_chain(template.id)
    latest = chain.get_latest_version(template.id)

    print(f"\n📜 Version chain ({len(versions)} versions):")
    for v in versions:
        marker = "▶" if v.id == latest.id else "◆"
        print(f"  {marker} {v.title} ({v.id[:8]}...)")

    # Show diff between original and v3
    differ = PromptDiff()
    diff = differ.diff(template, v3)
    print("\n🔍 Diff between original and v3:\n")
    print(differ.format(diff, colored=True))


if __name__ == "__main__":
    main()
