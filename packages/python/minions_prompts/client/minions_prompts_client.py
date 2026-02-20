from typing import Optional, List
from minions import Minions, MinionPlugin

from .plugin import PromptsPlugin, PromptsPluginAPI

class MinionsPrompts(Minions):
    """
    Standalone Central Client for the Prompts SDK.
    Inherits from `Minions` and automatically includes the `PromptsPlugin`.
    """
    
    prompts: PromptsPluginAPI

    def __init__(self, plugins: Optional[List[MinionPlugin]] = None):
        if plugins is None:
            plugins = []
            
        # Ensure PromptsPlugin is always included
        if not any(isinstance(p, PromptsPlugin) for p in plugins):
            plugins.append(PromptsPlugin())
            
        super().__init__(plugins=plugins)
