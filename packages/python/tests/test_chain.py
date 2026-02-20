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
