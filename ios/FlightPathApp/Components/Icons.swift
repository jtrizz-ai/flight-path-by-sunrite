import SwiftUI

// MARK: - Brand mark
//
// Recreates the SVG used in the design header / drawer:
//   <path d="M2 12h20M12 2l4 10-4 10-4-10z"/>
// A horizontal flight line crossed by a vertical "flight path" kite.

struct BrandMark: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let s = min(rect.width, rect.height) / 24
        let ox = rect.minX + (rect.width - 24 * s) / 2
        let oy = rect.minY + (rect.height - 24 * s) / 2
        func pt(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
            CGPoint(x: ox + x * s, y: oy + y * s)
        }
        // Horizontal line
        p.move(to: pt(2, 12))
        p.addLine(to: pt(22, 12))
        // Vertical kite
        p.move(to: pt(12, 2))
        p.addLine(to: pt(16, 12))
        p.addLine(to: pt(12, 22))
        p.addLine(to: pt(8, 12))
        p.closeSubpath()
        return p
    }
}

struct BrandMarkView: View {
    var size: CGFloat = 26
    var color: Color = .fpAccent2
    var lineWidth: CGFloat = 2

    var body: some View {
        BrandMark()
            .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round, lineJoin: .round))
            .frame(width: size, height: size)
    }
}
