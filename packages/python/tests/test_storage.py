"""Tests for InMemoryStorage."""
import pytest
from datetime import datetime, timezone
from minions import Minion, Relation
from minions_prompts.storage import InMemoryStorage


def make_minion(id: str) -> Minion:
    now = datetime.now(timezone.utc).isoformat()
    return Minion(
        id=id,
        title=f"Minion {id}",
        minion_type_id="test-type",
        fields={"data": id},
        created_at=now,
        updated_at=now,
    )


def make_relation(id: str, source_id: str, target_id: str) -> Relation:
    now = datetime.now(timezone.utc).isoformat()
    return Relation(
        id=id,
        source_id=source_id,
        target_id=target_id,
        type="follows",
        created_at=now,
    )


def test_save_and_get_roundtrip():
    storage = InMemoryStorage()
    m = make_minion("m1")
    storage.save_minion(m)
    retrieved = storage.get_minion("m1")
    assert retrieved is not None
    assert retrieved.id == "m1"


def test_save_and_list():
    storage = InMemoryStorage()
    storage.save_minion(make_minion("m1"))
    storage.save_minion(make_minion("m2"))
    all_minions = storage.get_all_minions()
    assert len(all_minions) == 2


def test_get_relations_empty_initially():
    storage = InMemoryStorage()
    storage.save_minion(make_minion("m1"))
    relations = storage.get_relations(target_id="m1")
    assert relations == []


def test_save_relation_and_get_relations():
    storage = InMemoryStorage()
    storage.save_minion(make_minion("m1"))
    storage.save_minion(make_minion("m2"))
    rel = make_relation("r1", "m2", "m1")
    storage.save_relation(rel)
    relations = storage.get_relations(target_id="m1")
    assert len(relations) == 1
    assert relations[0].id == "r1"


def test_overwrite_existing_minion():
    storage = InMemoryStorage()
    m = make_minion("m1")
    storage.save_minion(m)
    updated = Minion(
        id="m1",
        title="Updated Title",
        minion_type_id="test-type",
        fields={"data": "updated"},
        created_at=m.created_at,
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
    storage.save_minion(updated)
    retrieved = storage.get_minion("m1")
    assert retrieved is not None
    assert retrieved.title == "Updated Title"
