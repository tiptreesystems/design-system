import SwiftUI

/// A tintable native icon. Names describe drawings; the host owns semantic roles.
///
/// The visible square is measured in points. Stroke widths remain 1.5 pt (1 pt
/// for sanctioned sparkle details) regardless of size. Use a host `@ScaledMetric`
/// when the visible size should follow Dynamic Type; give interactive controls
/// their own accessible labels and at least a 44 x 44 pt hit target.
public struct TiptreeIcon: View {
    @Environment(\.layoutDirection) private var layoutDirection

    private let glyph: TiptreeGlyph
    private let size: CGFloat
    private let label: Text?
    private let mirrorsInRightToLeft: Bool

    /// Omit `label` for decoration, including icons inside an already labelled button.
    /// Enable mirroring only when the host's semantic role is directional.
    public init(
        _ glyph: TiptreeGlyph,
        size: CGFloat = 20,
        label: Text? = nil,
        mirrorsInRightToLeft: Bool = false
    ) {
        precondition(size.isFinite && size > 0, "Icon size must be finite and positive")
        self.glyph = glyph
        self.size = size
        self.label = label
        self.mirrorsInRightToLeft = mirrorsInRightToLeft
    }

    public var body: some View {
        Canvas { context, viewport in
            for path in glyph.paths {
                path.draw(in: context, size: viewport,
                          mirrored: mirrorsInRightToLeft && layoutDirection == .rightToLeft)
            }
        }
        .frame(width: size, height: size)
        .clipped()
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label ?? Text(""))
        .accessibilityAddTraits(.isImage)
        .accessibilityHidden(label == nil)
    }
}

#Preview("Native icons") {
    HStack(spacing: 16) {
        TiptreeIcon(.add, size: 16)
        TiptreeIcon(.moonStars, label: Text("Night mode"))
        TiptreeIcon(.plusHeavy, size: 40)
    }
    .foregroundStyle(TiptreeTokens.Colors.colorTextPrimary)
    .padding()
    .background(TiptreeTokens.Colors.colorBgPrimary)
}
