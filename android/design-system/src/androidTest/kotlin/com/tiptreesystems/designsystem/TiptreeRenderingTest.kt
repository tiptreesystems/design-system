package com.tiptreesystems.designsystem

import android.graphics.Bitmap
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Canvas
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.drawscope.CanvasDrawScope
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.test.platform.io.PlatformTestStorageRegistry
import kotlin.math.abs
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class TiptreeRenderingTest {
    @get:Rule val compose = createComposeRule()

    private inline fun Bitmap.use(block: (Bitmap) -> Unit) {
        try { block(this) } finally { recycle() }
    }

    private fun render(glyph: TiptreeGlyph, sizeDp: Int, density: Float = 1f, mirror: Boolean = false,
                       tint: Color = Color.Black): Bitmap {
        val pixels = (sizeDp * density).toInt()
        val image = ImageBitmap(pixels, pixels)
        CanvasDrawScope().draw(Density(density), LayoutDirection.Ltr, Canvas(image), Size(pixels.toFloat(), pixels.toFloat())) {
            with(TiptreeGlyphPainter(glyph, mirror)) { draw(size, colorFilter = ColorFilter.tint(tint)) }
        }
        return image.asAndroidBitmap()
    }

    @Test fun everyGlyphRendersAndProducesCanonicalComparisonSheets() {
        val storage = PlatformTestStorageRegistry.getInstance()
        val names = TiptreeIcons.names
        val sizes = listOf(16, 20, 40)
        for ((theme, colors) in listOf("light" to TiptreeColors.light, "dark" to TiptreeColors.dark)) {
            for (density in listOf(1, 2)) {
                val cell = 56 * density
                Bitmap.createBitmap(6 * 3 * cell, ((names.size + 5) / 6) * cell, Bitmap.Config.ARGB_8888).use { sheet ->
                    val canvas = android.graphics.Canvas(sheet)
                    canvas.drawColor(colors.colorBgPrimary.toArgb())
                    names.forEachIndexed { index, name ->
                        sizes.forEachIndexed { variant, size ->
                            val glyph = TiptreeIcons.named(name)!!
                            render(glyph, size, density.toFloat(), tint = colors.colorTextPrimary).use { bitmap ->
                                val pixels = IntArray(bitmap.width * bitmap.height)
                                bitmap.getPixels(pixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
                                assertTrue("$theme/$density/$size/$name is empty", pixels.any { android.graphics.Color.alpha(it) > 0 })
                                val left = (index % 6 * 3 + variant) * cell + (cell - bitmap.width) / 2
                                val top = index / 6 * cell + (cell - bitmap.height) / 2
                                canvas.drawBitmap(bitmap, left.toFloat(), top.toFloat(), null)
                            }
                        }
                    }
                    storage.openOutputFile("icon-parity/native-$theme-${density}x.png").use { sheet.compress(Bitmap.CompressFormat.PNG, 100, it) }
                }
            }
        }
        storage.openOutputFile("icon-parity/native-names.txt").use { it.write(names.joinToString("\n", postfix = "\n").toByteArray()) }
    }

    @Test fun strokesStayFixedWhileGeometryScalesAndMirroringPreservesPixels() {
        for (density in listOf(1f, 2f)) {
            for (size in listOf(16, 20, 40)) {
                val bitmap = render(TiptreeIcons.Add, size, density)
                val x = bitmap.width / 3
                val coverage = (0 until bitmap.height).sumOf { android.graphics.Color.alpha(bitmap.getPixel(x, it)) / 255.0 }
                assertEquals("$size dp at density $density", 1.5 * density, coverage, 0.08)
            }
        }
        val left = render(TiptreeIcons.AltArrowLeft, 40)
        val mirrored = render(TiptreeIcons.AltArrowLeft, 40, mirror = true)
        var maximumDelta = 0
        var totalDelta = 0L
        for (y in 0 until left.height) for (x in 0 until left.width) {
            val delta = abs(android.graphics.Color.alpha(left.getPixel(x, y)) -
                android.graphics.Color.alpha(mirrored.getPixel(left.width - x - 1, y)))
            maximumDelta = maxOf(maximumDelta, delta)
            totalDelta += delta
        }
        // Skia's diagonal edge quantization differs slightly under reflection.
        assertTrue("Mirrored edge differs by $maximumDelta/255", maximumDelta <= 8)
        assertTrue("Mirrored geometry changed", totalDelta.toDouble() / (left.width * left.height) < 0.5)
        val tinted = render(TiptreeIcons.Add, 40, tint = Color.Red)
        val pixel = tinted.getPixel(20, 20)
        assertEquals(255, android.graphics.Color.red(pixel))
        assertEquals(0, android.graphics.Color.green(pixel))
        assertEquals(0, android.graphics.Color.blue(pixel))
    }

    @Test fun themeChangesPropagateAndFontScaleRespectsInjectedFonts() {
        var dark by mutableStateOf(false)
        var fontScale by mutableStateOf(1f)
        var measuredHeight = 0
        var measuredLineHeight = 0f
        var palette: TiptreeColors? = null
        var material: Color? = null
        var family: FontFamily? = null
        compose.setContent {
            CompositionLocalProvider(LocalDensity provides Density(1f, fontScale)) {
                TiptreeTheme(darkTheme = dark, fonts = TiptreeFonts(sans = FontFamily.Monospace)) {
                    palette = TiptreeTheme.colors
                    material = MaterialTheme.colorScheme.background
                    family = TiptreeTheme.typography.regular.fontFamily
                    Text("Readable\ntext", style = TiptreeTheme.typography.regular,
                        onTextLayout = {
                            measuredHeight = it.size.height
                            measuredLineHeight = it.getLineBaseline(1) - it.getLineBaseline(0)
                        })
                }
            }
        }
        compose.runOnIdle {
            assertSame(TiptreeColors.light, palette)
            assertEquals(TiptreeColors.light.colorBgPrimary, material)
            assertEquals(FontFamily.Monospace, family)
            assertEquals(22.5f, measuredLineHeight, 1f)
        }
        val normalHeight = measuredHeight
        compose.runOnIdle { dark = true; fontScale = 2f }
        compose.runOnIdle {
            assertSame(TiptreeColors.dark, palette)
            assertEquals(TiptreeColors.dark.colorBgPrimary, material)
            // Compose retains the 1.5 line-height ratio around the nonlinearly
            // scaled font size, rather than independently scaling a 22.5sp box.
            val scaledSpacing = with(Density(1f, 2f)) { 15.sp.toPx() } * 1.5f
            assertEquals(scaledSpacing, measuredLineHeight, 1f)
            assertTrue("Text did not grow: $normalHeight -> $measuredHeight", measuredHeight > normalHeight)
        }
    }

    @Test fun accessibilityLabelsStayWithTheCallerAndRtlMirroringIsOptIn() {
        var direction by mutableStateOf(LayoutDirection.Ltr)
        compose.setContent {
            TiptreeTheme {
                CompositionLocalProvider(LocalLayoutDirection provides direction) {
                    Row {
                        IconButton(onClick = {}, modifier = Modifier.testTag("target")) {
                            TiptreeIcon(TiptreeIcons.AltArrowLeft, "Back", Modifier.size(20.dp).testTag("back"), autoMirror = true)
                        }
                        TiptreeIcon(TiptreeIcons.AltArrowLeft, null, Modifier.size(20.dp).testTag("decorative"))
                    }
                }
            }
        }
        compose.onNodeWithContentDescription("Back", useUnmergedTree = true).assertExists()
        compose.onNodeWithTag("target").assertTouchWidthIsEqualTo(48.dp).assertTouchHeightIsEqualTo(48.dp)
        compose.onNodeWithTag("decorative").assert(SemanticsMatcher.keyNotDefined(SemanticsProperties.ContentDescription))
        val normal = compose.onNodeWithTag("back", useUnmergedTree = true).captureToImage().asAndroidBitmap()
        val decorative = compose.onNodeWithTag("decorative").captureToImage().asAndroidBitmap()
        compose.runOnIdle { direction = LayoutDirection.Rtl }
        val reversed = compose.onNodeWithTag("back", useUnmergedTree = true).captureToImage().asAndroidBitmap()
        val still = compose.onNodeWithTag("decorative").captureToImage().asAndroidBitmap()
        assertFalse("Directional icon did not mirror", normal.sameAs(reversed))
        assertTrue("Decorative drawing mirrored unexpectedly", decorative.sameAs(still))
    }
}
