import SwiftUI
import XCTest
@testable import TiptreeDesignSystem

final class IconTests: XCTestCase {
    func testCatalogAndBundledAttribution() throws {
        let registry = try XCTUnwrap(TiptreeIconResources.registry)
        let data = try Data(contentsOf: registry)
        let source = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        let glyphs = try XCTUnwrap(source["glyphs"] as? [String: [String: Any]])
        XCTAssertEqual(Set(TiptreeGlyph.allCases.map(\.rawValue)), Set(glyphs.keys))
        for glyph in TiptreeGlyph.allCases {
            XCTAssertEqual(TiptreeGlyph.named(glyph.rawValue), glyph)
            XCTAssertEqual(glyph.cut, glyphs[glyph.rawValue]?["cut"] as? String)
            XCTAssertFalse(glyph.paths.isEmpty, glyph.rawValue)
            XCTAssertTrue(glyph.paths.allSatisfy { !$0.path.isEmpty }, glyph.rawValue)
        }
        let aliases = try XCTUnwrap(source["aliases"] as? [String: [String: String]])
        for (name, alias) in aliases {
            XCTAssertEqual(TiptreeGlyph.named(name)?.rawValue, alias["to"])
            XCTAssertNil(TiptreeGlyph(rawValue: name))
        }
        for name in ["", "unknown", "ADD", " add", "add\n"] { XCTAssertNil(TiptreeGlyph.named(name)) }
        for (url, text) in [(TiptreeIconResources.notice, "Solar"),
                            (TiptreeIconResources.apacheLicense, "Apache License"),
                            (TiptreeIconResources.creativeCommonsLicense, "Attribution 4.0") ] {
            let contents = try String(contentsOf: XCTUnwrap(url), encoding: .utf8)
            XCTAssertTrue(contents.contains(text))
        }
    }

    func testOnlySanctionedSparklesUseThinStrokes() {
        var thinGlyphs: Set<TiptreeGlyph> = []
        for glyph in TiptreeGlyph.allCases {
            for path in glyph.paths where !path.filled {
                XCTAssertTrue(path.lineWidth == 1 || path.lineWidth == 1.5, glyph.rawValue)
                if path.lineWidth == 1 { thinGlyphs.insert(glyph) }
            }
        }
        XCTAssertEqual(thinGlyphs, [.moonStars, .starsMinimalistic])
        XCTAssertTrue(TiptreeGlyph.plusHeavy.paths.allSatisfy(\.filled))
    }

    @MainActor
    func testNativeContactSheets() throws {
        let names = TiptreeGlyph.allCases.map(\.rawValue).joined(separator: "\n") + "\n"
        attach(Data(names.utf8), name: "native-names.txt", type: "public.plain-text")
        for scheme in [ColorScheme.light, .dark] {
            for scale in [1.0, 2.0] {
                let image = try render(IconContactSheet().environment(\.colorScheme, scheme), scale: scale)
                XCTAssertEqual(image.width, Int(1008 * scale))
                XCTAssertEqual(image.height, Int(ceil(Double(TiptreeGlyph.allCases.count) / 6) * 56 * scale))
                let png = try XCTUnwrap(UIImage(cgImage: image).pngData())
                attach(png, name: "native-\(scheme == .light ? "light" : "dark")-\(Int(scale))x.png", type: "public.png")
            }
        }
    }

    @MainActor
    func testStrokeRemainsOneAndAHalfPointsWhenGeometryScales() throws {
        for scale in [1.0, 2.0, 3.0] {
            var reference: Double?
            for size in [16.0, 20.0, 40.0] {
                let image = try render(TiptreeIcon(.add, size: size)
                    .foregroundStyle(TiptreeTokens.Colors.brandBlack), scale: scale)
                let bytes = try pixels(image)
                let column = Int(size * scale / 3)
                let coverage = (0..<image.height).reduce(0.0) { sum, row in
                    sum + Double(bytes[(row * image.width + column) * 4 + 3]) / 255
                } / scale
                // Antialiased coverage may lose a fraction of a raster pixel;
                // geometry scaling must never change it at a given density.
                XCTAssertEqual(coverage, 1.5, accuracy: 0.25 / scale, "\(size)pt at \(scale)x")
                if let reference { XCTAssertEqual(coverage, reference, accuracy: 0.01) }
                else { reference = coverage }
            }
        }
    }

    @MainActor
    func testTintAndOptInSemanticMirroring() throws {
        let glyph = try XCTUnwrap(TiptreeGlyph.named("arrow-left"))
        let base = TiptreeIcon(glyph, size: 40).foregroundStyle(TiptreeTokens.Colors.brandTealDark)
        let ltr = try pixels(render(base))
        XCTAssertEqual(ltr, try pixels(render(base.environment(\.layoutDirection, .rightToLeft))))
        let mirrored = TiptreeIcon(glyph, size: 40, label: Text("Back"), mirrorsInRightToLeft: true)
            .foregroundStyle(TiptreeTokens.Colors.brandTealDark)
            .environment(\.layoutDirection, .rightToLeft)
        let rtl = try pixels(render(mirrored))
        XCTAssertNotEqual(ltr, rtl)
        let otherTint = try pixels(render(TiptreeIcon(glyph, size: 40).foregroundStyle(TiptreeTokens.Colors.brandYellow)))
        XCTAssertNotEqual(ltr, otherTint)
        // Reflection reverses every scanline, allowing one quantization step at antialiased edges.
        for y in 0..<40 { for x in 0..<40 { for channel in 0..<4 {
            XCTAssertLessThanOrEqual(abs(Int(ltr[(y * 40 + x) * 4 + channel]) - Int(rtl[(y * 40 + 39 - x) * 4 + channel])), 1)
        } } }
    }

    @MainActor
    private func render(_ view: some View, scale: Double = 1) throws -> CGImage {
        let renderer = ImageRenderer(content: view.environment(\.displayScale, scale))
        renderer.scale = scale
        return try XCTUnwrap(renderer.cgImage)
    }

    private func pixels(_ image: CGImage) throws -> [UInt8] {
        var bytes = [UInt8](repeating: 0, count: image.width * image.height * 4)
        let context = try XCTUnwrap(CGContext(data: &bytes, width: image.width, height: image.height,
                                             bitsPerComponent: 8, bytesPerRow: image.width * 4,
                                             space: CGColorSpaceCreateDeviceRGB(),
                                             bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
        context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
        return bytes
    }

    private func attach(_ data: Data, name: String, type: String) {
        let attachment = XCTAttachment(data: data, uniformTypeIdentifier: type)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
