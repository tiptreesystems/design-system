"""Flask integration: version-stamped, immutably-cached design-system assets.

Usage in the app factory:

    from tiptree_ui.blueprint import create_blueprint, stylesheet_tags
    app.register_blueprint(create_blueprint())
    # in the page shell:
    head_html += stylesheet_tags()

URLs embed the package version (/tt-assets/<version>/tokens.css), which is
what makes the immutable Cache-Control header safe: a new release changes the
URL, so nothing stale is ever served (DESIGN_SYSTEM_PLAN.md section 2, Lacuna row).
"""

from importlib import resources

from tiptree_ui import __version__

_IMMUTABLE = "public, max-age=31536000, immutable"
_ASSETS = ("tokens.css", "tt.css")


def create_blueprint(url_prefix: str = "/tt-assets"):
    from flask import Blueprint, Response, abort

    bp = Blueprint("tiptree_ui", __name__)

    @bp.route(f"{url_prefix}/<version>/<name>")
    def tt_asset(version: str, name: str):
        if name not in _ASSETS:
            abort(404)
        body = (resources.files("tiptree_ui") / "assets" / name).read_text("utf-8")
        return Response(
            body,
            mimetype="text/css",
            headers={"Cache-Control": _IMMUTABLE if version == __version__ else "no-cache"},
        )

    return bp


def stylesheet_tags(url_prefix: str = "/tt-assets") -> str:
    return "".join(
        f'<link rel="stylesheet" href="{url_prefix}/{__version__}/{name}">' for name in _ASSETS
    )
