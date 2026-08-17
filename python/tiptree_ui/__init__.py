"""tiptree-ui: Tiptree shared tokens and themes for Python consumers.

Ships generated primitives, theme policies, resolved values for media pipelines,
and (with the flask extra) a Blueprint serving content-addressed CSS. Graduated
components join only after a production consumer adopts their shared contract.
"""

from tiptree_ui._tokens import TOKENS, for_brand

__version__ = "0.3.1"
__all__ = ["TOKENS", "for_brand", "__version__"]
