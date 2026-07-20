"""tiptree-ui: the Tiptree design system for Python consumers.

Ships the generated tokens.css / tt.css as package data, brand/theme-resolved
token values for media pipelines, and (with the flask extra) a Blueprint that
serves the assets at version-stamped, immutably-cached URLs.

Component bindings (button(), card(), ...) land here after the experiment
phase decides the contract surface - see DESIGN_SYSTEM_PLAN.md section 5.
"""

from tiptree_ui._tokens import TOKENS, for_brand

__version__ = "0.1.0"
__all__ = ["TOKENS", "for_brand", "__version__"]
