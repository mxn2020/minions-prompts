"""
A/B Testing Example (Python)
Compare two prompt versions with scored test cases.
"""

from minions import create_minion, generate_id, now, Relation
from minions_prompts import (
    prompt_template_type,
    prompt_version_type,
    prompt_test_type,
    PromptScorer,
    InMemoryStorage,
)


def main():
    storage = InMemoryStorage()

    # Prompt v1: concise
    v1, _ = create_minion(
        {
            "title": "Explainer v1",
            "fields": {
                "content": "Explain {{concept}} simply.",
                "variables": ["concept"],
            },
        },
        prompt_template_type,
    )
    storage.save_minion(v1)

    # Prompt v2: detailed
    v2, _ = create_minion(
        {
            "title": "Explainer v2",
            "fields": {
                "content": "Explain {{concept}} to a {{audience}} in 3-4 sentences.\nUse an analogy if helpful. Avoid jargon.",
                "versionNumber": 2,
                "changelog": "Added audience targeting and style guidance",
                "variables": ["concept", "audience"],
            },
        },
        prompt_version_type,
    )
    storage.save_minion(v2)
    storage.save_relation(Relation(
        id=generate_id(),
        source_id=v2.id,
        target_id=v1.id,
        type="follows",
        created_at=now(),
    ))

    # Create test cases
    test_cases_data = [
        {"title": "Explain neural networks", "inputVariables": {"concept": "neural networks", "audience": "students"}},
        {"title": "Explain blockchain", "inputVariables": {"concept": "blockchain", "audience": "managers"}},
    ]

    test_minions = []
    for tc in test_cases_data:
        test, _ = create_minion(
            {
                "title": tc["title"],
                "fields": {
                    "inputVariables": tc["inputVariables"],
                    "scoringDimensions": ["clarity", "accuracy", "conciseness"],
                },
            },
            prompt_test_type,
        )
        storage.save_minion(test)
        test_minions.append(test)

    scorer = PromptScorer(storage)

    # Simulated evaluations
    v1_evals = [
        {"scores": {"clarity": 60, "accuracy": 80, "conciseness": 85}, "passed": True},
        {"scores": {"clarity": 58, "accuracy": 75, "conciseness": 90}, "passed": True},
    ]
    v2_evals = [
        {"scores": {"clarity": 88, "accuracy": 82, "conciseness": 72}, "passed": True},
        {"scores": {"clarity": 85, "accuracy": 78, "conciseness": 70}, "passed": True},
    ]

    comparisons = scorer.compare_versions(
        v1.id,
        v2.id,
        [t.id for t in test_minions],
        v1_evals,
        v2_evals,
    )

    print("\n📊 A/B Comparison Results\n")
    print("=" * 60)

    for i, cmp in enumerate(comparisons):
        tc = test_cases_data[i]
        print(f"\nTest: {tc['title']}")
        print(f"Winner: {'✅ v2' if cmp.winner == 'v2' else '◀ v1' if cmp.winner == 'v1' else '🤝 Tie'}")
        print("Score deltas (positive = v2 wins):")
        for dim, delta in cmp.deltas.items():
            sign = "+" if delta > 0 else ""
            print(f"  {dim}: {sign}{delta}")

    v2_wins = sum(1 for c in comparisons if c.winner == "v2")
    print(f"\n{'=' * 60}")
    print(f"\nOverall: v2 won {v2_wins}/{len(comparisons)} tests")


if __name__ == "__main__":
    main()
