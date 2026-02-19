"""
PromptChain — traverses follows relations to reconstruct complete version history.
"""

from __future__ import annotations

from minions import Minion

from .storage import PromptStorage


class PromptChain:
    """Traverses ``follows`` relations to reconstruct the complete prompt lineage.

    Args:
        storage: The storage backend to use for minion and relation retrieval.

    Example::

        storage = InMemoryStorage()
        chain = PromptChain(storage)
        versions = chain.get_version_chain(prompt_id)
        latest = chain.get_latest_version(prompt_id)
    """

    def __init__(self, storage: PromptStorage) -> None:
        self._storage = storage

    def get_version_chain(self, prompt_id: str) -> list[Minion]:
        """Return all versions in the chain, sorted oldest first.

        Traverses ``follows`` relations from the given prompt backwards to the
        root, then collects all forward-linked versions.

        Args:
            prompt_id: The ID of any minion in the version chain.

        Returns:
            List of minions in chronological order (oldest first).
        """
        root = self._find_root(prompt_id)
        visited: set[str] = set()
        chain: list[Minion] = []
        queue = [root.id]
        visited.add(root.id)
        chain.append(root)

        while queue:
            current_id = queue.pop(0)
            following = self._storage.get_relations(target_id=current_id, type="follows")
            for rel in following:
                if rel.source_id not in visited:
                    visited.add(rel.source_id)
                    minion = self._storage.get_minion(rel.source_id)
                    if minion:
                        chain.append(minion)
                        queue.append(rel.source_id)

        from datetime import datetime
        chain.sort(key=lambda m: datetime.fromisoformat(m.created_at))
        return chain

    def get_latest_version(self, prompt_id: str) -> Minion:
        """Return the most recently created leaf version.

        Args:
            prompt_id: The ID of any minion in the chain.

        Returns:
            The latest version minion.

        Raises:
            ValueError: If no version chain is found.
        """
        chain = self.get_version_chain(prompt_id)
        if not chain:
            raise ValueError(f"No version chain found for prompt {prompt_id}")

        chain_ids = {m.id for m in chain}
        leaf_nodes = []
        for minion in chain:
            successors = self._storage.get_relations(target_id=minion.id, type="follows")
            chain_successors = [r for r in successors if r.source_id in chain_ids]
            if not chain_successors:
                leaf_nodes.append(minion)

        from datetime import datetime
        leaf_nodes.sort(key=lambda m: datetime.fromisoformat(m.created_at), reverse=True)
        return leaf_nodes[0]

    def get_version_at_date(self, prompt_id: str, date: "datetime") -> Minion | None:
        """Return the version that was active at a specific date.

        Args:
            prompt_id: The ID of any minion in the chain.
            date: The target datetime.

        Returns:
            The active version at that date, or None if none existed yet.
        """
        from datetime import datetime
        chain = self.get_version_chain(prompt_id)
        target_ts = date.timestamp()

        candidates = [
            m for m in chain
            if datetime.fromisoformat(m.created_at).timestamp() <= target_ts
        ]
        if not candidates:
            return None

        candidates.sort(key=lambda m: datetime.fromisoformat(m.created_at), reverse=True)
        return candidates[0]

    def _find_root(self, start_id: str) -> Minion:
        """Walk backwards via follows to find the chain root."""
        visited: set[str] = set()
        current_id = start_id

        while True:
            if current_id in visited:
                raise ValueError(f"Cycle detected in follows chain at {current_id}")
            visited.add(current_id)

            follows_rels = self._storage.get_relations(source_id=current_id, type="follows")
            if not follows_rels:
                minion = self._storage.get_minion(current_id)
                if not minion:
                    raise ValueError(f"Minion not found: {current_id}")
                return minion

            current_id = follows_rels[0].target_id
