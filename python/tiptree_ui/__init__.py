"""tiptree-ui: the Tiptree design system for Python consumers.

Ships generated primitives, themes, per-component CSS, brand/theme-resolved
token values for media pipelines, and (with the flask extra) a Blueprint that
serves selective compositions at content-addressed, immutably-cached URLs.

Component bindings (button(), card(), ...) land here after the experiment
phase decides the contract surface - see DESIGN_SYSTEM_PLAN.md section 5.
"""

from tiptree_ui._tokens import TOKENS, for_brand

__version__ = "0.2.0"
__all__ = ["TOKENS", "for_brand", "__version__"]
