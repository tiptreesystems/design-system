// GENERATED from tokens/tokens.json v0.10.0; DO NOT EDIT.
package com.tiptreesystems.designsystem

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing as ComposeEasing
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*

object TiptreeTokens {
    const val sourceVersion: String = "0.10.0"
    object Colors {
        val black: Color = Color(0xFF000000)
        val brandBlack: Color = Color(0xFF1B1B1B)
        val brandGrey: Color = Color(0xFFEDEDE9)
        val brandGreyMedium: Color = Color(0xFFADADA8)
        val brandTealDark: Color = Color(0xFF47696B)
        val brandTealLight: Color = Color(0xFF638B8D)
        val brandWhite: Color = Color(0xFFFFFFFF)
        val brandYellow: Color = Color(0xFFE3E6A6)
        val citron100: Color = Color(0xFFF4F5DB)
        val citron200: Color = Color(0xFFE3E6A6)
        val citron300: Color = Color(0xFFCFD478)
        val citron400: Color = Color(0xFFB7BE54)
        val citron500: Color = Color(0xFF9BA23C)
        val citron600: Color = Color(0xFF7D842E)
        val citron700: Color = Color(0xFF616724)
        val citron800: Color = Color(0xFF474B1B)
        val citron900: Color = Color(0xFF2F3212)
        val colorBlue: Color = Color(0xFF0A84FF)
        val colorGreen: Color = Color(0xFF27A644)
        val colorOrange: Color = Color(0xFFFC7840)
        val colorRed: Color = Color(0xFFEB5757)
        val colorYellow: Color = Color(0xFFF0BF00)
        val stone000: Color = Color(0xFFFFFFFF)
        val stone050: Color = Color(0xFFFCFCFB)
        val stone100: Color = Color(0xFFF8F8F6)
        val stone1000: Color = Color(0xFF10100F)
        val stone1050: Color = Color(0xFF0D0D0C)
        val stone150: Color = Color(0xFFF1F1EC)
        val stone200: Color = Color(0xFFEDEDE9)
        val stone250: Color = Color(0xFFE6E6E0)
        val stone300: Color = Color(0xFFDCDCD4)
        val stone350: Color = Color(0xFFCFCFC6)
        val stone400: Color = Color(0xFFBEBEB3)
        val stone450: Color = Color(0xFFA6A69B)
        val stone500: Color = Color(0xFF909088)
        val stone550: Color = Color(0xFF7E7C73)
        val stone600: Color = Color(0xFF6F6F67)
        val stone650: Color = Color(0xFF5C5C55)
        val stone700: Color = Color(0xFF4D4D47)
        val stone750: Color = Color(0xFF3B3B38)
        val stone800: Color = Color(0xFF33332F)
        val stone850: Color = Color(0xFF282826)
        val stone875: Color = Color(0xFF222220)
        val stone900: Color = Color(0xFF1B1B1A)
        val stone950: Color = Color(0xFF161615)
        val teal100: Color = Color(0xFFE4EEEE)
        val teal200: Color = Color(0xFFC8DCDC)
        val teal300: Color = Color(0xFFA3C3C4)
        val teal400: Color = Color(0xFF82A7A9)
        val teal500: Color = Color(0xFF638B8D)
        val teal550: Color = Color(0xFF3C8286)
        val teal600: Color = Color(0xFF47696B)
        val teal650: Color = Color(0xFF346F72)
        val teal700: Color = Color(0xFF3A5759)
        val teal800: Color = Color(0xFF2D4345)
        val teal900: Color = Color(0xFF1F3031)
    }
    object Radius {
        val radius12: Dp = 12.0f.dp
        val radius16: Dp = 16.0f.dp
        val radius20: Dp = 20.0f.dp
        val radius24: Dp = 24.0f.dp
        val radius28: Dp = 28.0f.dp
        val radius4: Dp = 4.0f.dp
        val radius6: Dp = 6.0f.dp
        val radius8: Dp = 8.0f.dp
        val radiusBlock: Dp = 20.0f.dp
        val radiusField: Dp = 16.0f.dp
        val radiusFull: Dp = 9999.0f.dp
        val radiusRow: Dp = 12.0f.dp
    }
    object Space {
        val space025: Dp = 2.0f.dp
        val space050: Dp = 4.0f.dp
        val space075: Dp = 6.0f.dp
        val space100: Dp = 8.0f.dp
        val space150: Dp = 12.0f.dp
        val space200: Dp = 16.0f.dp
        val space250: Dp = 20.0f.dp
        val space300: Dp = 24.0f.dp
        val space400: Dp = 32.0f.dp
        val space500: Dp = 40.0f.dp
        val space600: Dp = 48.0f.dp
        val space800: Dp = 64.0f.dp
    }
    object Size {
        val controlDefault: Dp = 36.0f.dp
        val controlHero: Dp = 56.0f.dp
        val controlLarge: Dp = 44.0f.dp
        val controlSmall: Dp = 28.0f.dp
        val glyphLarge: Dp = 20.0f.dp
        val glyphSmall: Dp = 16.0f.dp
    }
    object Stroke {
        val borderHairline: Dp = 1.0f.dp
        val focusRingOffset: Dp = 2.0f.dp
        val focusRingWidth: Dp = 2.0f.dp
    }
    object Duration {
        const val speedBrisk: Int = 150
        const val speedQuick: Int = 100
        const val speedRegular: Int = 250
        const val speedSlow: Int = 400
    }
    object Easing {
        val easeInOutCubic: ComposeEasing = CubicBezierEasing(0.645f, 0.045f, 0.355f, 1.0f)
        val easeOutQuad: ComposeEasing = CubicBezierEasing(0.25f, 0.46f, 0.45f, 0.94f)
    }
    object FontFamilies {
        val fontCode: List<String> = listOf("Google Sans Code", "ui-monospace", "sfmono-regular", "SF Mono", "menlo", "monaco", "consolas", "monospace")
        val fontHeadingPageFamily: List<String> = listOf("Literata", "Literata Fallback", "Georgia", "serif")
        val fontHeadingSectionFamily: List<String> = listOf("Literata", "Literata Fallback", "Georgia", "serif")
        val fontHeadingSubFamily: List<String> = listOf("Inter Variable", "Inter", "Inter Fallback", "SF Pro Display", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Arial", "sans-serif")
        val fontHeadingTitleFamily: List<String> = listOf("Literata", "Literata Fallback", "Georgia", "serif")
        val fontMono: List<String> = listOf("ui-monospace", "SF Mono", "Menlo", "monospace")
        val fontSans: List<String> = listOf("Inter Variable", "Inter", "Inter Fallback", "SF Pro Display", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Arial", "sans-serif")
        val fontSerif: List<String> = listOf("Literata", "Literata Fallback", "Georgia", "serif")
    }
    object Type {
        val fontHeadingDisplayLetterSpacing: TextUnit = -0.022f.em
        const val fontHeadingDisplayLineHeight: Float = 1.05f
        val fontHeadingDisplaySize: TextUnit = 52.0f.sp
        val fontHeadingDisplayWeight: FontWeight = FontWeight(300)
        val fontHeadingPageLetterSpacing: TextUnit = -0.02f.em
        const val fontHeadingPageLineHeight: Float = 1.2f
        val fontHeadingPageSize: TextUnit = 40.0f.sp
        val fontHeadingPageWeight: FontWeight = FontWeight(300)
        val fontHeadingSectionLetterSpacing: TextUnit = -0.01f.em
        const val fontHeadingSectionLineHeight: Float = 1.33f
        val fontHeadingSectionSize: TextUnit = 22.0f.sp
        val fontHeadingSectionWeight: FontWeight = FontWeight(400)
        val fontHeadingSubLetterSpacing: TextUnit = -0.012f.em
        const val fontHeadingSubLineHeight: Float = 1.4f
        val fontHeadingSubSize: TextUnit = 17.0f.sp
        val fontHeadingSubWeight: FontWeight = FontWeight(510)
        val fontHeadingTitleLetterSpacing: TextUnit = -0.015f.em
        const val fontHeadingTitleLineHeight: Float = 1.25f
        val fontHeadingTitleSize: TextUnit = 32.0f.sp
        val fontHeadingTitleWeight: FontWeight = FontWeight(400)
        val fontLetterSpacingLarge: TextUnit = 0.0f.em
        val fontLetterSpacingMicro: TextUnit = 0.0f.em
        val fontLetterSpacingMini: TextUnit = -0.01f.em
        val fontLetterSpacingRegular: TextUnit = -0.011f.em
        val fontLetterSpacingSmall: TextUnit = -0.013f.em
        val fontLetterSpacingTiny: TextUnit = -0.015f.em
        const val fontLineHeightLarge: Float = 1.6f
        const val fontLineHeightMicro: Float = 1.4f
        const val fontLineHeightMini: Float = 1.5f
        const val fontLineHeightRegular: Float = 1.5f
        const val fontLineHeightSmall: Float = 1.5714285714285714f
        const val fontLineHeightTiny: Float = 1.5f
        val fontSizeLarge: TextUnit = 17.0f.sp
        val fontSizeMicro: TextUnit = 12.0f.sp
        val fontSizeMini: TextUnit = 13.0f.sp
        val fontSizeRegular: TextUnit = 15.0f.sp
        val fontSizeSmall: TextUnit = 14.0f.sp
        val fontSizeTiny: TextUnit = 10.0f.sp
        val fontWeightBold: FontWeight = FontWeight(680)
        val fontWeightLight: FontWeight = FontWeight(300)
        val fontWeightMedium: FontWeight = FontWeight(510)
        val fontWeightNormal: FontWeight = FontWeight(400)
        val fontWeightSemibold: FontWeight = FontWeight(590)
    }
}
