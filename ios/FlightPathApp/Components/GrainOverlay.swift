import SwiftUI

// MARK: - Film grain overlay
//
// Mirrors the design's SVG feTurbulence grain (opacity .06, blend overlay).
// A noise tile is generated once and tiled across the screen.

struct GrainOverlay: View {
    var opacity: Double = 0.06

    private static let tile: Image? = GrainOverlay.makeNoise(160)

    var body: some View {
        GeometryReader { geo in
            if let tile = Self.tile {
                tile
                    .resizable(resizingMode: .tile)
                    .frame(width: geo.size.width, height: geo.size.height)
                    .blendMode(.overlay)
                    .opacity(opacity)
                    .allowsHitTesting(false)
            }
        }
        .allowsHitTesting(false)
    }

    private static func makeNoise(_ n: Int) -> Image? {
        let width = n, height = n
        var pixels = [UInt8](repeating: 0, count: width * height * 4)
        for i in 0..<(width * height) {
            let v = UInt8.random(in: 0...255)
            pixels[i * 4 + 0] = v
            pixels[i * 4 + 1] = v
            pixels[i * 4 + 2] = v
            pixels[i * 4 + 3] = 255
        }
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue)
        guard let ctx = CGContext(
            data: &pixels,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: width * 4,
            space: colorSpace,
            bitmapInfo: bitmapInfo.rawValue
        ), let cg = ctx.makeImage() else {
            return nil
        }
        return Image(decorative: cg, scale: 1, orientation: .up)
    }
}
