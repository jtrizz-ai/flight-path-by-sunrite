import SwiftUI

struct TypingIndicator: View {
    @State private var phase: Double = 0
    private let dotSize: CGFloat = 6
    private let spacing: CGFloat = 4

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 5) {
                Text("FLIGHT PATH AI")
                    .font(FPFont.mono(9))
                    .tracking(1.6)
                    .foregroundColor(.ink3)
                HStack(spacing: spacing) {
                    ForEach(0..<3) { i in
                        Circle()
                            .fill(Color.ink3)
                            .frame(width: dotSize, height: dotSize)
                            .opacity(opacity(for: i))
                    }
                }
                .padding(.vertical, 8)
            }
            .padding(.horizontal, 14)
            .background(Color.card)
            .overlay(
                UnevenRoundedRectangle(
                    topLeadingRadius: 16,
                    bottomLeadingRadius: 5,
                    bottomTrailingRadius: 16,
                    topTrailingRadius: 16
                )
                .stroke(Color.cardLine, lineWidth: 1)
            )
            .clipShape(
                UnevenRoundedRectangle(
                    topLeadingRadius: 16,
                    bottomLeadingRadius: 5,
                    bottomTrailingRadius: 16,
                    topTrailingRadius: 16
                )
            )
            Spacer(minLength: 40)
        }
        .onAppear {
            withAnimation(.linear(duration: 1.2).repeatForever(autoreverses: false)) {
                phase = 1
            }
        }
    }

    private func opacity(for index: Int) -> Double {
        let offset = Double(index) / 3.0
        let t = (phase + offset).truncatingRemainder(dividingBy: 1)
        return 0.3 + 0.6 * sin(t * 2 * .pi)
    }
}
