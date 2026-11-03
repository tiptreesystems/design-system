package com.tiptreesystems.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview

@Preview(name = "Light", showBackground = true)
@Preview(name = "Dark", showBackground = true, uiMode = android.content.res.Configuration.UI_MODE_NIGHT_YES)
@Preview(name = "Large text", fontScale = 2f, showBackground = true)
@Composable
private fun TiptreePreview() {
    TiptreeTheme {
        Surface {
            Column(Modifier.padding(TiptreeTokens.Space.space200), verticalArrangement = Arrangement.spacedBy(TiptreeTokens.Space.space100)) {
                Text("Tiptree", style = TiptreeTheme.typography.title)
                Text("Canonical tokens and native icons", style = TiptreeTheme.typography.regular)
                Row(horizontalArrangement = Arrangement.spacedBy(TiptreeTokens.Space.space100)) {
                    listOf("add", "moon-stars", "menu-dots", "copy").mapNotNull(TiptreeIcons::named).forEach {
                        TiptreeIcon(it, it.name)
                    }
                }
                Text("Warning", color = TiptreeTheme.colors.colorStatusWarningFg)
                Text("Success", color = TiptreeTheme.colors.colorStatusSuccessFg)
            }
        }
    }
}
