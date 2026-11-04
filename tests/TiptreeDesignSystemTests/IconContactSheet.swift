import SwiftUI
import TiptreeDesignSystem

struct IconContactSheet: View {
    private let sizes: [CGFloat] = [16, 20, 40]

    var body: some View {
        ZStack(alignment: .topLeading) {
            ForEach(Array(TiptreeGlyph.allCases.enumerated()), id: \.element) { index, glyph in
                ForEach(Array(sizes.enumerated()), id: \.offset) { variant, size in
                    TiptreeIcon(glyph, size: size)
                        .position(x: CGFloat((index % 6) * 3 + variant) * 56 + 28,
                                  y: CGFloat(index / 6) * 56 + 28)
                }
            }
        }
        .frame(width: 1008, height: ceil(Double(TiptreeGlyph.allCases.count) / 6) * 56)
        .foregroundStyle(TiptreeTokens.Colors.colorTextPrimary)
        .background(TiptreeTokens.Colors.colorBgPrimary)
    }
}

#Preview("Complete native catalog") {
    ScrollView([.horizontal, .vertical]) { IconContactSheet() }
}
