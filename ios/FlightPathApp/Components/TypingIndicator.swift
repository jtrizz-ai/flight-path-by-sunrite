import SwiftUI

struct TypingIndicator: View {
    @State private var orbitAngle: Double = 0
    @State private var pulseScale: CGFloat = 1.0
    @State private var textOpacity: Double = 1.0

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 5) {
                Text("FLIGHT PATH AI")
                    .font(FPFont.mono(9))
                    .tracking(1.6)
                    .foregroundColor(.ink3)

                HStack(spacing: 10) {
                    orbitView

                    Text("THINKING...")
                        .font(FPFont.mono(9))
                        .tracking(1.4)
                        .foregroundColor(.ink3)
                        .opacity(textOpacity)
                }
                .padding(.vertical, 8)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 4)
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
            withAnimation(.linear(duration: 2.0).repeatForever(autoreverses: false)) {
                orbitAngle = 360
            }
            withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true)) {
                pulseScale = 1.4
            }
            withAnimation(.easeInOut(duration: 1.1).repeatForever(autoreverses: true)) {
                textOpacity = 0.35
            }
        }
    }

    private var orbitView: some View {
        ZStack {
            // Dashed orbit path
            Circle()
                .stroke(style: StrokeStyle(lineWidth: 1, dash: [2, 3]))
                .foregroundColor(.fpAccent.opacity(0.35))
                .frame(width: 28, height: 28)

            // Pulsing center dot
            Circle()
                .fill(Color.fpAccent)
                .frame(width: 4, height: 4)
                .scaleEffect(pulseScale)
                .shadow(color: .fpAccent.opacity(0.8), radius: 4)

            // Orbiting glow dot — offset from center inside a rotating container
            ZStack {
                Circle()
                    .fill(Color.runwayLight)
                    .frame(width: 6, height: 6)
                    .shadow(color: Color.runwayLight.opacity(0.9), radius: 5)
                    .offset(x: 11, y: 0)
            }
            .frame(width: 28, height: 28)
            .rotationEffect(.degrees(orbitAngle))
        }
        .frame(width: 28, height: 28)
    }
}
