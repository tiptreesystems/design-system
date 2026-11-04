package com.tiptreesystems.designsystem

import androidx.compose.material3.Typography
import androidx.compose.runtime.Immutable
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit

/** Consumers bundle/load fonts. Platform families are explicit fallbacks, not Inter/Literata. */
@Immutable
data class TiptreeFonts(
    val sans: FontFamily = FontFamily.SansSerif,
    val serif: FontFamily = FontFamily.Serif,
    val mono: FontFamily = FontFamily.Monospace,
    val code: FontFamily = mono,
) {
    internal fun family(names: List<String>): FontFamily = when (names) {
        TiptreeTokens.FontFamilies.fontSans -> sans
        TiptreeTokens.FontFamilies.fontSerif -> serif
        TiptreeTokens.FontFamilies.fontMono -> mono
        TiptreeTokens.FontFamilies.fontCode -> code
        else -> error("The generated heading family has no native font slot")
    }
}

/** Native styles retain the catalog's names and scale through Android's sp/em conversion. */
@Immutable
class TiptreeTypography(private val fonts: TiptreeFonts) {
    private val t = TiptreeTokens.Type
    private fun body(size: TextUnit, height: Float, tracking: TextUnit) =
        style(fonts.sans, size, height, tracking, t.fontWeightNormal)

    val large = body(t.fontSizeLarge, t.fontLineHeightLarge, t.fontLetterSpacingLarge)
    val regular = body(t.fontSizeRegular, t.fontLineHeightRegular, t.fontLetterSpacingRegular)
    val small = body(t.fontSizeSmall, t.fontLineHeightSmall, t.fontLetterSpacingSmall)
    val mini = body(t.fontSizeMini, t.fontLineHeightMini, t.fontLetterSpacingMini)
    val micro = body(t.fontSizeMicro, t.fontLineHeightMicro, t.fontLetterSpacingMicro)
    val tiny = body(t.fontSizeTiny, t.fontLineHeightTiny, t.fontLetterSpacingTiny)
    val display = style(fonts.serif, t.fontHeadingDisplaySize, t.fontHeadingDisplayLineHeight,
        t.fontHeadingDisplayLetterSpacing, t.fontHeadingDisplayWeight)
    val page = style(fonts.family(TiptreeTokens.FontFamilies.fontHeadingPageFamily), t.fontHeadingPageSize, t.fontHeadingPageLineHeight,
        t.fontHeadingPageLetterSpacing, t.fontHeadingPageWeight)
    val title = style(fonts.family(TiptreeTokens.FontFamilies.fontHeadingTitleFamily), t.fontHeadingTitleSize, t.fontHeadingTitleLineHeight,
        t.fontHeadingTitleLetterSpacing, t.fontHeadingTitleWeight)
    val section = style(fonts.family(TiptreeTokens.FontFamilies.fontHeadingSectionFamily), t.fontHeadingSectionSize, t.fontHeadingSectionLineHeight,
        t.fontHeadingSectionLetterSpacing, t.fontHeadingSectionWeight)
    val sub = style(fonts.family(TiptreeTokens.FontFamilies.fontHeadingSubFamily), t.fontHeadingSubSize, t.fontHeadingSubLineHeight,
        t.fontHeadingSubLetterSpacing, t.fontHeadingSubWeight)
    val code = regular.copy(fontFamily = fonts.code)

    fun materialTypography(): Typography = Typography(
        displayLarge = display, displayMedium = page, displaySmall = title,
        headlineLarge = page, headlineMedium = title, headlineSmall = section,
        titleLarge = section, titleMedium = sub, titleSmall = regular.copy(fontWeight = t.fontWeightMedium),
        bodyLarge = large, bodyMedium = regular, bodySmall = small,
        labelLarge = small.copy(fontWeight = t.fontWeightSemibold),
        labelMedium = micro.copy(fontWeight = t.fontWeightSemibold),
        labelSmall = tiny.copy(fontWeight = t.fontWeightSemibold),
    )

    private fun style(family: FontFamily, size: TextUnit, height: Float, tracking: TextUnit, weight: FontWeight) =
        TextStyle(fontFamily = family, fontSize = size, lineHeight = size * height,
            letterSpacing = tracking, fontWeight = weight)
}
