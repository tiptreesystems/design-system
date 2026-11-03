package com.tiptreesystems.designsystem

import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Matrix
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp

/** Canonical drawing identity. Accessibility and action roles belong to the caller. */
@Immutable
class TiptreeGlyph internal constructor(
    val name: String,
    val cut: String,
    internal val paths: List<GlyphPath>,
)

internal class GlyphPath(
    private val data: String,
    val filled: Boolean,
    val strokeWidth: Float,
    val cap: StrokeCap,
    val join: StrokeJoin,
    private val evenOdd: Boolean,
    private val oval: Rect? = null,
) {
    // Parsed once per used glyph, never during a draw or for unused catalog entries.
    val path: Path by lazy {
        // Keep SVG circles/ellipses as native conics rather than approximating them
        // through the path parser's elliptical-arc-to-cubic conversion.
        (if (oval != null) Path().apply { addOval(oval) } else PathParser().parsePathString(data).toPath()).apply {
            fillType = if (evenOdd) PathFillType.EvenOdd else PathFillType.NonZero
        }
    }
}

/** Geometry scales with the viewport; the canonical 1.5/1 stroke stays fixed in dp. */
internal class TiptreeGlyphPainter(private val glyph: TiptreeGlyph, private val mirror: Boolean) : Painter() {
    override val intrinsicSize: Size = Size.Unspecified
    private var previousSize = Size.Unspecified
    private val scaledPaths = glyph.paths.map { Path() }

    override fun DrawScope.onDraw() {
        val scale = size.minDimension / 24f
        if (!scale.isFinite() || scale <= 0f) return
        if (size != previousSize) {
            // SVG non-scaling-stroke transforms geometry before stroking. Keeping
            // that order also avoids scaled-stroke rasterization errors at 16 dp.
            val matrix = Matrix().apply {
                translate((size.width - 24f * scale) / 2f + if (mirror) 24f * scale else 0f,
                    (size.height - 24f * scale) / 2f)
                scale(if (mirror) -scale else scale, scale)
            }
            glyph.paths.forEachIndexed { index, part ->
                scaledPaths[index].apply {
                    reset()
                    addPath(part.path)
                    fillType = part.path.fillType
                    transform(matrix)
                }
            }
            previousSize = size
        }
        glyph.paths.forEachIndexed { index, part ->
            if (part.filled) drawPath(scaledPaths[index], Color.Black)
            else drawPath(scaledPaths[index], Color.Black, style = Stroke(
                width = part.strokeWidth.dp.toPx(), cap = part.cap, join = part.join, miter = 4f,
            ))
        }
    }
}

/** Opt in to mirroring only when the action is directional (for example Back). */
@Composable
fun rememberTiptreeIconPainter(glyph: TiptreeGlyph, autoMirror: Boolean = false): Painter {
    val mirror = autoMirror && LocalLayoutDirection.current == LayoutDirection.Rtl
    return remember(glyph, mirror) { TiptreeGlyphPainter(glyph, mirror) }
}

/** Decorative icons use a null description; interactive parents supply accessible hit targets. */
@Composable
fun TiptreeIcon(
    glyph: TiptreeGlyph,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    tint: Color = LocalContentColor.current,
    autoMirror: Boolean = false,
) {
    Icon(
        painter = rememberTiptreeIconPainter(glyph, autoMirror),
        contentDescription = contentDescription,
        modifier = modifier.size(TiptreeTokens.Size.glyphLarge),
        tint = tint,
    )
}
