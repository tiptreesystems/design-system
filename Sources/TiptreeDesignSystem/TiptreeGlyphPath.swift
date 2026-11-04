import SwiftUI

struct TiptreeGlyphPath: Sendable {
    let path: Path
    let filled: Bool
    let lineWidth: CGFloat
    let cap: CGLineCap
    let join: CGLineJoin
    let evenOdd: Bool

    func draw(in context: GraphicsContext, size: CGSize, mirrored: Bool) {
        // Transform geometry before stroking: SVG non-scaling-stroke maps px to pt.
        let transform = CGAffineTransform(
            a: size.width / 24 * (mirrored ? -1 : 1), b: 0,
            c: 0, d: size.height / 24, tx: mirrored ? size.width : 0, ty: 0
        )
        let scaled = path.applying(transform)
        if filled {
            context.fill(scaled, with: .foreground, style: FillStyle(eoFill: evenOdd))
        } else {
            context.stroke(scaled, with: .foreground, style: StrokeStyle(
                lineWidth: lineWidth, lineCap: cap, lineJoin: join, miterLimit: 4
            ))
        }
    }
}
