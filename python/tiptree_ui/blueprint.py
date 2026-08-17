"""Compose and serve content-addressed design-system CSS.

The package contains generated primitives, theme policies, and a manifest of any
graduated components. Consumers explicitly choose a theme and optional component
subset. The resulting URL is keyed by the composition bytes.
"""

from __future__ import annotations

from hashlib import sha256
from html import escape
from importlib import resources
import json
from typing import Iterable


_IMMUTABLE = "public, max-age=31536000, immutable"
_THEMES = frozenset(("light-default", "dark-default", "explicit"))


def _assets():
    return resources.files("tiptree_ui") / "assets"


def _manifest() -> dict:
    return json.loads((_assets() / "manifest.json").read_text("utf-8"))


def compose(
    components: Iterable[str], theme: str = "light-default"
) -> tuple[str, str]:
    """Return CSS and its SHA-256 for an explicit component subset and theme."""
    requested = list(components)
    if len(requested) != len(set(requested)):
        raise ValueError("duplicate component names are not allowed")
    if theme not in _THEMES:
        raise ValueError(f"unknown theme: {theme}")

    manifest = _manifest()
    known = manifest["components"]
    unknown = [name for name in requested if name not in known]
    if unknown:
        raise ValueError(f"unknown component(s): {', '.join(unknown)}")

    asset_root = _assets()
    ordered = [name for name in manifest["order"] if name in set(requested)]
    paths = [asset_root / "primitives.css", asset_root / "themes" / f"{theme}.css"]
    paths.extend(asset_root / known[name]["file"] for name in ordered)
    css_text = "\n".join(path.read_text("utf-8").rstrip() for path in paths) + "\n"
    return css_text, sha256(css_text.encode("utf-8")).hexdigest()


def stylesheet_tags(
    components: Iterable[str], theme: str = "light-default", url_prefix: str = "/tt-assets"
) -> str:
    """Return the stylesheet link for the same explicit composition as the Blueprint."""
    _, content_hash = compose(components, theme)
    href = f"{url_prefix.rstrip('/')}/{content_hash}/tt.css"
    return f'<link rel="stylesheet" href="{escape(href, quote=True)}">'


def create_blueprint(
    components: Iterable[str], theme: str = "light-default", url_prefix: str = "/tt-assets"
):
    """Precompose and serve one immutable stylesheet from a Flask Blueprint."""
    from flask import Blueprint, Response, abort

    css_text, content_hash = compose(components, theme)
    bp = Blueprint("tiptree_ui", __name__)

    @bp.route(f"{url_prefix.rstrip('/')}/<requested_hash>/tt.css")
    def tt_asset(requested_hash: str):
        if requested_hash != content_hash:
            abort(404)
        return Response(css_text, mimetype="text/css", headers={"Cache-Control": _IMMUTABLE})

    return bp
