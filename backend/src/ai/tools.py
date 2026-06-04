"""
Tool registration manifest.

Importing this module triggers @tool_registry.register decorators in all sub-modules,
registering every tool with the singleton tool_registry.
main.py imports this file once at startup — no other changes required when adding tools.
"""

from src.ai.tools_customers import *  # noqa: F401, F403
from src.ai.tools_email import *  # noqa: F401, F403
from src.ai.tools_operations import *  # noqa: F401, F403
from src.ai.tools_reports import *  # noqa: F401, F403
