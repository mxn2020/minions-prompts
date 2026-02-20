from typing import Any
from minions import Minions, MinionPlugin

from ..prompt_renderer import PromptRenderer
from ..prompt_chain import PromptChain
from ..prompt_diff import PromptDiff
from ..prompt_scorer import PromptScorer
from ..prompt_exporter import PromptExporter
from ..storage import InMemoryStorage
from ..schemas import register_prompt_types

class PromptsPluginAPI:
    def __init__(self, core: Minions):
        self.storage = InMemoryStorage()
        self.renderer = PromptRenderer()
        self.diff = PromptDiff()
        self.scorer = PromptScorer(self.storage)
        self.exporter = PromptExporter(self.storage)
    
    def create_chain(self) -> PromptChain:
        return PromptChain(self.storage)

class PromptsPlugin(MinionPlugin):
    """
    MinionPlugin implementation that mounts Prompts capabilities onto the core Minions client.
    """
    @property
    def namespace(self) -> str:
        return "prompts"
        
    def init(self, core: Minions) -> Any:
        # Register prompt types in the core registry
        register_prompt_types(core.registry)
        
        # Return the API instance to be mounted at `minions.prompts`
        return PromptsPluginAPI(core)
