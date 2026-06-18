import SwiftUI

// MARK: - Launch / runway approach lights
//
// Port of the design's JavaScript light field. Two converging rows of lights
// recede toward a vanishing point and flash in sequence, creating a "racing
// toward the launch pad" effect. Geometry matches the original constants so the
// lights line up with the rocket-on-the-road background image (1376×768, cover).

struct LaunchLights: View {
    // Source image intrinsic size (used to replicate object-fit: cover mapping)
    private let imageW: CGFloat = 1376
    private let imageH: CGFloat = 768
    private let count = 20
    private let duration: Double = 2.1   // seconds (DURATION 2100ms)

    // Vanishing point + near-edge anchors (fractions of the image)
    private let vpX: CGFloat = 0.505
    private let vpY: CGFloat = 0.635
    private let nlx: CGFloat = 0.305
    private let nrx: CGFloat = 0.715

    var body: some View {
        GeometryReader { geo in
            TimelineView(.animation) { timeline in
                Canvas { context, size in
                    let t = timeline.date.timeIntervalSinceReferenceDate
                    draw(in: context, size: size, time: t)
                }
            }
        }
        .allowsHitTesting(false)
    }

    private func draw(in context: GraphicsContext, size: CGSize, time: Double) {
        let W = size.width, H = size.height
        guard W > 0, H > 0 else { return }

        // object-fit: cover mapping
        let scale = max(W / imageW, H / imageH)
        let rW = imageW * scale
        let rH = imageH * scale
        let oX = (W - rW) / 2
        let oY = (H - rH) / 2

        for i in 1..<count {
            let s = CGFloat(i) / CGFloat(count - 1)
            let sp = pow(s, 1.7)
            let fy = vpY + (1.0 - vpY) * sp
            let fxL = vpX + (nlx - vpX) * sp
            let fxR = vpX + (nrx - vpX) * sp
            let dotSize = 2 + 12 * sp

            // staggered flash phase (delay = -s * duration in CSS)
            var phase = (time / duration + Double(s)).truncatingRemainder(dividingBy: 1.0)
            if phase < 0 { phase += 1 }
            let (op, glow) = flash(phase)

            for fx in [fxL, fxR] {
                let cx = oX + fx * rW
                let cy = oY + fy * rH
                let rect = CGRect(x: cx - dotSize / 2, y: cy - dotSize / 2,
                                  width: dotSize, height: dotSize)

                // Glow halo
                if glow > 0.01 {
                    let halo = dotSize * (1 + 2.4 * glow)
                    let haloRect = CGRect(x: cx - halo / 2, y: cy - halo / 2,
                                          width: halo, height: halo)
                    context.fill(
                        Path(ellipseIn: haloRect),
                        with: .color(Color.runwayLight.opacity(0.55 * glow))
                    )
                }
                context.fill(
                    Path(ellipseIn: rect),
                    with: .color(Color.runwayLight.opacity(op))
                )
            }
        }
    }

    /// CSS keyframes: 0%→.14, 5%→1.0, 18%→.14, 100%→.14
    private func flash(_ phase: Double) -> (opacity: Double, glow: Double) {
        let base = 0.14
        if phase < 0.05 {
            let k = phase / 0.05
            return (base + (1.0 - base) * k, k)
        } else if phase < 0.18 {
            let k = 1 - (phase - 0.05) / 0.13
            return (base + (1.0 - base) * k, max(0, k))
        } else {
            return (base, 0)
        }
    }
}
