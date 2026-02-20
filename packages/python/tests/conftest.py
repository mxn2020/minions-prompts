import pytest


@pytest.fixture
def storage():
    from minions_prompts.storage import InMemoryStorage
    return InMemoryStorage()
