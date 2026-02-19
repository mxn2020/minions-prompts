"""
Storage interface and in-memory implementation for minions-prompts.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from minions import Minion, Relation


class PromptStorage(ABC):
    """Abstract base class for prompt storage backends."""

    @abstractmethod
    def get_minion(self, id: str) -> Minion | None:
        """Retrieve a minion by ID."""
        ...

    @abstractmethod
    def save_minion(self, minion: Minion) -> None:
        """Persist a minion."""
        ...

    @abstractmethod
    def get_relations(
        self,
        *,
        source_id: str | None = None,
        target_id: str | None = None,
        type: str | None = None,
    ) -> list[Relation]:
        """Retrieve relations matching the given filters."""
        ...

    @abstractmethod
    def save_relation(self, relation: Relation) -> None:
        """Persist a relation."""
        ...


class InMemoryStorage(PromptStorage):
    """In-memory storage implementation for development and testing.

    Not suitable for production use.

    Example::

        storage = InMemoryStorage()
        chain = PromptChain(storage)
    """

    def __init__(self) -> None:
        self._minions: dict[str, Minion] = {}
        self._relations: list[Relation] = []

    def get_minion(self, id: str) -> Minion | None:
        """Retrieve a minion by ID, or None if not found."""
        return self._minions.get(id)

    def save_minion(self, minion: Minion) -> None:
        """Store a minion, overwriting any existing entry with the same ID."""
        self._minions[minion.id] = minion

    def get_relations(
        self,
        *,
        source_id: str | None = None,
        target_id: str | None = None,
        type: str | None = None,
    ) -> list[Relation]:
        """Return relations matching all provided filters."""
        results = []
        for r in self._relations:
            if source_id is not None and r.source_id != source_id:
                continue
            if target_id is not None and r.target_id != target_id:
                continue
            if type is not None and r.type != type:
                continue
            results.append(r)
        return results

    def save_relation(self, relation: Relation) -> None:
        """Append a relation to the store."""
        self._relations.append(relation)

    def get_all_minions(self) -> list[Minion]:
        """Return all stored minions."""
        return list(self._minions.values())

    def get_all_relations(self) -> list[Relation]:
        """Return all stored relations."""
        return list(self._relations)

    def clear(self) -> None:
        """Clear all stored data."""
        self._minions.clear()
        self._relations.clear()
