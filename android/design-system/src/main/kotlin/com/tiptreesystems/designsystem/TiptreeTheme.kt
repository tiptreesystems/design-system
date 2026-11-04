package com.tiptreesystems.designsystem

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.compositeOver

/** Material roles are a convenience mapping. The complete semantic palette remains available. */
fun TiptreeColors.materialColorScheme(): ColorScheme = lightColorScheme(
    primary = colorLink,
    onPrimary = colorBgPrimary,
    primaryContainer = colorAccentTint,
    onPrimaryContainer = colorTextPrimary,
    secondary = colorAccent,
    onSecondary = colorBgPrimary,
    secondaryContainer = colorAccentTint,
    onSecondaryContainer = colorTextPrimary,
    tertiary = colorAccent,
    onTertiary = colorBgPrimary,
    tertiaryContainer = colorBgTertiary,
    onTertiaryContainer = colorTextPrimary,
    background = colorBgPrimary,
    onBackground = colorTextPrimary,
    surface = colorBgPrimary,
    onSurface = colorTextPrimary,
    surfaceVariant = colorBgSecondary,
    onSurfaceVariant = colorTextSecondary,
    surfaceDim = colorBgSecondary,
    surfaceBright = colorSurfaceCard,
    surfaceContainerLowest = colorBgGround,
    surfaceContainerLow = colorSurfaceCard,
    surfaceContainer = colorBgSecondary,
    surfaceContainerHigh = colorBgTertiary,
    // Source overlays are still exposed unchanged; Material containers need an opaque surface.
    surfaceContainerHighest = colorSurfaceOpen.compositeOver(colorBgPrimary),
    surfaceTint = colorAccent,
    inverseSurface = colorSurfaceInverse,
    inverseOnSurface = colorTextOnInverse,
    inversePrimary = colorTextOnInverse,
    outline = colorBorderPrimary,
    outlineVariant = colorBorderSection,
    error = colorStatusDangerFg,
    onError = colorStatusDangerBg,
    errorContainer = colorStatusDangerBg,
    onErrorContainer = colorStatusDangerFg,
    scrim = TiptreeTokens.Colors.brandBlack,
    primaryFixed = TiptreeTokens.Colors.teal100,
    primaryFixedDim = TiptreeTokens.Colors.teal200,
    onPrimaryFixed = TiptreeTokens.Colors.teal900,
    onPrimaryFixedVariant = TiptreeTokens.Colors.teal700,
    secondaryFixed = TiptreeTokens.Colors.teal100,
    secondaryFixedDim = TiptreeTokens.Colors.teal200,
    onSecondaryFixed = TiptreeTokens.Colors.teal900,
    onSecondaryFixedVariant = TiptreeTokens.Colors.teal700,
    tertiaryFixed = TiptreeTokens.Colors.citron100,
    tertiaryFixedDim = TiptreeTokens.Colors.citron200,
    onTertiaryFixed = TiptreeTokens.Colors.citron900,
    onTertiaryFixedVariant = TiptreeTokens.Colors.citron700,
)

private val LocalTiptreeColors = staticCompositionLocalOf { TiptreeColors.light }
private val LocalTiptreeTypography = staticCompositionLocalOf { TiptreeTypography(TiptreeFonts()) }

object TiptreeTheme {
    val colors: TiptreeColors
        @Composable @ReadOnlyComposable get() = LocalTiptreeColors.current
    val typography: TiptreeTypography
        @Composable @ReadOnlyComposable get() = LocalTiptreeTypography.current
}

@Composable
fun TiptreeTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    fonts: TiptreeFonts = TiptreeFonts(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) TiptreeColors.dark else TiptreeColors.light
    val materialColors = remember(colors) { colors.materialColorScheme() }
    val typography = remember(fonts) { TiptreeTypography(fonts) }
    val materialType = remember(typography) { typography.materialTypography() }
    val shapes = remember {
        Shapes(
            extraSmall = RoundedCornerShape(TiptreeTokens.Radius.radius4),
            small = RoundedCornerShape(TiptreeTokens.Radius.radius8),
            medium = RoundedCornerShape(TiptreeTokens.Radius.radiusRow),
            large = RoundedCornerShape(TiptreeTokens.Radius.radiusField),
            extraLarge = RoundedCornerShape(TiptreeTokens.Radius.radiusBlock),
        )
    }
    CompositionLocalProvider(LocalTiptreeColors provides colors, LocalTiptreeTypography provides typography) {
        MaterialTheme(colorScheme = materialColors, typography = materialType, shapes = shapes, content = content)
    }
}
