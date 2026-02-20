import pytest
from minions import Minions
from minions_prompts import MinionsPrompts, PromptsPlugin

def test_minions_prompts_standalone_client():
    client = MinionsPrompts()
    assert hasattr(client, "prompts")
    assert hasattr(client.prompts, "renderer")
    
    rendered = client.prompts.renderer.render("hello {{name}}", {"name": "world"})
    assert rendered == "hello world"

def test_prompts_plugin_mounting_on_core():
    minions = Minions(plugins=[PromptsPlugin()])
    assert hasattr(minions, "prompts")
    assert hasattr(minions.prompts, "create_chain")
    
    chain = minions.prompts.create_chain()
    assert chain is not None
