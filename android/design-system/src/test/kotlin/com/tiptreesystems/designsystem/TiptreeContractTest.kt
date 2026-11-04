package com.tiptreesystems.designsystem

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import org.junit.Assert.*
import org.junit.Test

class TiptreeContractTest {
    @Test fun semanticRelationshipsSurviveMaterialMappingInBothThemes() {
        for (colors in listOf(TiptreeColors.light, TiptreeColors.dark)) {
            val material = colors.materialColorScheme()
            assertEquals(colors.colorLink, material.primary)
            assertEquals(colors.colorTextPrimary, material.onSurface)
            assertEquals(colors.colorSurfaceOpen.compositeOver(colors.colorBgPrimary), material.surfaceContainerHighest)
            assertEquals(1f, material.surfaceContainerHighest.alpha)
            assertNotEquals(colors.colorSurfaceCard, colors.colorSurfaceSunken)
            assertEquals(4, setOf(colors.colorStatusDangerFg, colors.colorStatusWarningFg,
                colors.colorStatusInfoFg, colors.colorStatusSuccessFg).size)
            assertNotEquals(colors.colorStatusDangerFg, colors.colorStatusDangerBg)
        }
        assertEquals(Color(0x0FFFFFFF), TiptreeColors.dark.colorSurfaceHover)
        assertEquals(Color(0xFF5C5C55), TiptreeColors.dark.colorBorderBoxFocus)
    }

    @Test fun typographyUsesNativeUnitsExactWeightsAndInjectedFamilies() {
        val family = FontFamily.Cursive
        val type = TiptreeTypography(TiptreeFonts(sans = family, serif = FontFamily.Monospace, code = FontFamily.SansSerif))
        assertEquals(family, type.regular.fontFamily)
        assertEquals(FontFamily.Monospace, type.title.fontFamily)
        assertEquals(FontFamily.SansSerif, type.code.fontFamily)
        assertEquals(family, type.sub.fontFamily)
        assertEquals(15.sp, type.regular.fontSize)
        assertEquals(22.sp, type.small.lineHeight)
        assertEquals((-0.011f).em, type.regular.letterSpacing)
        assertEquals(510, type.sub.fontWeight!!.weight)
        assertEquals(type.regular, type.materialTypography().bodyMedium)
        assertEquals(8.dp, TiptreeTokens.Space.space100)
        assertEquals(16.dp, TiptreeTokens.Size.glyphSmall)
        assertEquals(20.dp, TiptreeTokens.Size.glyphLarge)
        assertEquals(150, TiptreeTokens.Duration.speedBrisk)
        assertEquals(0f, TiptreeTokens.Easing.easeOutQuad.transform(0f))
        assertEquals(1f, TiptreeTokens.Easing.easeOutQuad.transform(1f))
    }

    @Test fun catalogLookupIsTypedLazyAndRejectsUnknownNames() {
        assertEquals(131, TiptreeIcons.names.size)
        assertEquals(TiptreeIcons.names.size, TiptreeIcons.names.toSet().size)
        for (name in TiptreeIcons.names) {
            val glyph = TiptreeIcons.named(name)!!
            assertEquals(name, glyph.name)
            assertTrue(glyph.paths.isNotEmpty())
            assertSame(glyph, TiptreeIcons.named(name))
        }
        assertSame(TiptreeIcons.Add, TiptreeIcons.named("add"))
        for (name in listOf("", "../add", "Add", "unapproved-extension")) assertNull(TiptreeIcons.named(name))
    }
}
