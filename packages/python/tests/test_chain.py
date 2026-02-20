"""Tests for PromptChain."""

import pytest
from datetime import datetime, timezone
from minions import Minion, Relation
from minions_prompts import PromptChain
from minions_prompts.storage import InMemoryStorage


def make_minion(id: str, fields: dict = None, created_at: str = None) -> Minion:
    now = datetime.now(timezone.utc).isoformat()
    return Minion(
        id=id,
        title=f"Prompt {id}",
        minion_type_id="minions-prompts/prompt-template",
        fields=fields or {},
        created_at=created_at or now,
        updated_at=now,
    )


def make_follows(source_id: str, target_id: str) -> Relation:
    now = datetime.now(timezone.utc).isoformat()
    return Relation(
        id=f"rel-{source_id}-{target_id}",
        source_id=source_id,
        target_id=target_id,
        type="follows",
        created_at=now,
    )


@pytest.fixture
def storage():
    return InMemoryStorage()


@pytest.fixture
def chain(storage):
    return PromptChain(storage)


def test_single_element_chain(storage, chain):
    root = make_minion("root", {"content": "Hello world"})
    storage.save_minion(root)

    result = chain.get_version_chain("root")
    assert len(result) == 1
    assert result[0].id == "root"


def test_linear_version_history(storage, chain):
    v1 = make_minion("v1", {"content": "v1"}, "2025-01-01T00:00:00+00:00")
    v2 = make_minion("v2", {"content": "v2"}, "2025-01-02T00:00:00+00:00")
    v3 = make_minion("v3", {"content": "v3"}, "2025-01-03T00:00:00+00:00")
    storage.save_minion(v1)
    storage.save_minion(v2)
    storage.save_minion(v3)
    storage.save_relation(make_follows("v2", "v1"))
    storage.save_relation(make_follows("v3", "v2"))

    result = chain.get_version_chain("v1")
    assert len(result) == 3
    assert [m.id for m in result] == ["v1", "v2", "v3"]


def test_chain_from_middle_node(storage, chain):
    v1 = make_minion("v1", {"content": "v1"}, "2025-01-01T00:00:00+00:00")
    v2 = make_minion("v2", {"content": "v2"}, "2025-01-02T00:00:00+00:00")
    storage.save_minion(v1)
    storage.save_minion(v2)
    storage.save_relation(make_follows("v2", "v1"))

    result = chain.get_version_chain("v2")
    assert len(result) == 2
    assert result[0].id == "v1"
    assert result[1].id == "v2"


def test_get_latest_version(storage, chain):
    v1 = make_minion("v1", {"content": "v1"}, "2025-01-01T00:00:00+00:00")
    v2 = make_minion("v2", {"content": "v2"}, "2025-01-02T00:00:00+00:00")
    storage.save_minion(v1)
    storage.save_minion(v2)
    storage.save_relation(make_follows("v2", "v1"))

    latest = chain.get_latest_version("v1")
    assert latest.id == "v2"


def test_get_latest_version_single(storage, chain):
    root = make_minion("root", {"content": "Only version"})
    storage.save_minion(root)

    latest = chain.get_latest_version("root")
    assert latest.id == "root"


def test_get_version_at_date_returns_active_version(storage, chain):
    v1 = make_minion("v1", {"content": "v1"}, "2025-01-01T00:00:00+00:00")
    v2 = make_minion("v2", {"content": "v2"}, "2025-01-03T00:00:00+00:00")
    storage.save_minion(v1)
    storage.save_minion(v2)
    storage.save_relation(make_follows("v2", "v1"))

    target = datetime(2025, 1, 2, tzinfo=timezone.utc)
    result = chain.get_version_at_date("v1", target)
    assert result is not None
    assert result.id == "v1"


def test_get_version_at_date_returns_none_before_chain_start(storage, chain):
    v1 = make_minion("v1", {"content": "v1"}, "2025-06-01T00:00:00+00:00")
    storage.save_minion(v1)

    target = datetime(2025, 1, 1, tzinfo=timezone.utc)
    result = chain.get_version_at_date("v1", target)
    assert result is None


# ── New tests ──────────────────────────────────────────────────────────────────


def test_chain_of_five_versions_all_returned_in_order(storage, chain):
    versions = []
    for i in range(1, 6):
        ts = f"2025-01-0{i}T00:00:00+00:00"
        m = make_minion(f"v{i}", {"content": f"v{i}"}, ts)
        storage.save_minion(m)
        versions.append(m)

    for i in range(2, 6):
        storage.save_relation(make_follows(f"v{i}", f"v{i - 1}"))

    result = chain.get_version_chain("v1")
    assert len(result) == 5
    assert [m.id for m in result] == ["v1", "v2", "v3", "v4", "v5"]


def test_get_version_at_date_with_exact_timestamp(storage, chain):
    exact_ts = "2025-03-15T12:00:00+00:00"
    v1 = make_minion("v1", {"content": "v1"}, "2025-01-01T00:00:00+00:00")
    v2 = make_minion("v2", {"content": "v2"}, exact_ts)
    storage.save_minion(v1)
    storage.save_minion(v2)
    storage.save_relation(make_follows("v2", "v1"))

    target = datetime(2025, 3, 15, 12, 0, 0, tzinfo=timezone.utc)
    result = chain.get_version_at_date("v1", target)
    assert result is not None
    assert result.id == "v2"


def test_get_latest_version_with_five_version_chain_returns_v5(storage, chain):
    for i in range(1, 6):
        ts = f"2025-01-0{i}T00:00:00+00:00"
        storage.save_minion(make_minion(f"v{i}", {"content": f"v{i}"}, ts))

    for i in range(2, 6):
        storage.save_relation(make_follows(f"v{i}", f"v{i - 1}"))

    latest = chain.get_latest_version("v1")
    assert latest.id == "v5"


def test_get_version_chain_preserves_created_at_timestamps(storage, chain):
    timestamps = [
        "2025-02-01T00:00:00+00:00",
        "2025-02-02T00:00:00+00:00",
        "2025-02-03T00:00:00+00:00",
    ]
    for i, ts in enumerate(timestamps, start=1):
        storage.save_minion(make_minion(f"v{i}", {"content": f"v{i}"}, ts))

    storage.save_relation(make_follows("v2", "v1"))
    storage.save_relation(make_follows("v3", "v2"))

    result = chain.get_version_chain("v1")
    assert result[0].created_at == timestamps[0]
    assert result[1].created_at == timestamps[1]
    assert result[2].created_at == timestamps[2]


def test_get_version_chain_from_deepest_node_returns_full_chain(storage, chain):
    v1 = make_minion("v1", {"content": "v1"}, "2025-01-01T00:00:00+00:00")
    v2 = make_minion("v2", {"content": "v2"}, "2025-01-02T00:00:00+00:00")
    v3 = make_minion("v3", {"content": "v3"}, "2025-01-03T00:00:00+00:00")
    storage.save_minion(v1)
    storage.save_minion(v2)
    storage.save_minion(v3)
    storage.save_relation(make_follows("v2", "v1"))
    storage.save_relation(make_follows("v3", "v2"))

    # Start from the deepest (latest) node
    result = chain.get_version_chain("v3")
    assert len(result) == 3
    assert [m.id for m in result] == ["v1", "v2", "v3"]


def test_get_version_at_date_between_v2_and_v3_returns_v2(storage, chain):
    v1 = make_minion("v1", {"content": "v1"}, "2025-01-01T00:00:00+00:00")
    v2 = make_minion("v2", {"content": "v2"}, "2025-01-10T00:00:00+00:00")
    v3 = make_minion("v3", {"content": "v3"}, "2025-01-20T00:00:00+00:00")
    storage.save_minion(v1)
    storage.save_minion(v2)
    storage.save_minion(v3)
    storage.save_relation(make_follows("v2", "v1"))
    storage.save_relation(make_follows("v3", "v2"))

    # Query for a date between v2 and v3 creation
    target = datetime(2025, 1, 15, tzinfo=timezone.utc)
    result = chain.get_version_at_date("v1", target)
    assert result is not None
    assert result.id == "v2"


def test_two_chains_in_storage_get_version_chain_returns_only_correct_chain(storage, chain):
    # Chain A: a1 -> a2
    a1 = make_minion("a1", {"content": "a1"}, "2025-01-01T00:00:00+00:00")
    a2 = make_minion("a2", {"content": "a2"}, "2025-01-02T00:00:00+00:00")
    # Chain B: b1 -> b2
    b1 = make_minion("b1", {"content": "b1"}, "2025-01-01T00:00:00+00:00")
    b2 = make_minion("b2", {"content": "b2"}, "2025-01-02T00:00:00+00:00")

    storage.save_minion(a1)
    storage.save_minion(a2)
    storage.save_minion(b1)
    storage.save_minion(b2)
    storage.save_relation(make_follows("a2", "a1"))
    storage.save_relation(make_follows("b2", "b1"))

    result_a = chain.get_version_chain("a1")
    result_b = chain.get_version_chain("b1")

    assert {m.id for m in result_a} == {"a1", "a2"}
    assert {m.id for m in result_b} == {"b1", "b2"}


def test_get_version_at_date_after_all_versions_returns_latest(storage, chain):
    v1 = make_minion("v1", {"content": "v1"}, "2025-01-01T00:00:00+00:00")
    v2 = make_minion("v2", {"content": "v2"}, "2025-01-02T00:00:00+00:00")
    storage.save_minion(v1)
    storage.save_minion(v2)
    storage.save_relation(make_follows("v2", "v1"))

    # Date well after both versions
    target = datetime(2026, 1, 1, tzinfo=timezone.utc)
    result = chain.get_version_at_date("v1", target)
    assert result is not None
    assert result.id == "v2"


def test_get_latest_version_single_element_returns_it(storage, chain):
    only = make_minion("only", {"content": "solo"}, "2025-05-01T00:00:00+00:00")
    storage.save_minion(only)

    latest = chain.get_latest_version("only")
    assert latest.id == "only"


def test_chain_of_three_middle_version_properly_included(storage, chain):
    v1 = make_minion("v1", {"content": "v1"}, "2025-01-01T00:00:00+00:00")
    v2 = make_minion("v2", {"content": "v2"}, "2025-01-02T00:00:00+00:00")
    v3 = make_minion("v3", {"content": "v3"}, "2025-01-03T00:00:00+00:00")
    storage.save_minion(v1)
    storage.save_minion(v2)
    storage.save_minion(v3)
    storage.save_relation(make_follows("v2", "v1"))
    storage.save_relation(make_follows("v3", "v2"))

    result = chain.get_version_chain("v1")
    ids = [m.id for m in result]
    assert "v2" in ids
    assert ids.index("v1") < ids.index("v2") < ids.index("v3")
