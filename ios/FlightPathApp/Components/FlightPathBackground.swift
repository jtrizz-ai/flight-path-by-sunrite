import SwiftUI

// MARK: - Flight Path Background

struct FlightPathBackground<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        ZStack {
            // Primary background
            FlightPathTheme.Background.primary
                .ignoresSafeArea()

            // Radial gradient
            RadialGradient(
                colors: [
                    FlightPathTheme.Background.secondary.opacity(0.3),
                    FlightPathTheme.Background.primary,
                ],
                center: .topLeading,
                startRadius: 100,
                endRadius: 800
            )
            .ignoresSafeArea()

            // Accent circle 1 (planet-like glow)
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            FlightPathTheme.Accent.primary.opacity(0.15),
                            Color.clear,
                        ],
                        center: .center,
                        startRadius: 50,
                        endRadius: 200
                    )
                )
                .frame(width: 250, height: 250)
                .position(x: 80, y: 150)
                .blur(radius: 60)

            // Accent circle 2
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            FlightPathTheme.Accent.secondary.opacity(0.1),
                            Color.clear,
                        ],
                        center: .center,
                        startRadius: 30,
                        endRadius: 150
                    )
                )
                .frame(width: 180, height: 180)
                .position(x: 320, y: 600)
                .blur(radius: 50)

            // Content
            content
        }
    }
}

// MARK: - Preview

#if DEBUG
struct FlightPathBackground_Previews: ViewProvider {
    static var previews: some View {
        FlightPathBackground {
            VStack {
                Text("Flight Path App")
                    .font(FlightPathFonts.display())
                    .foregroundColor(FlightPathTheme.Text.primary)

                Text("Dark theme with gradient background")
                    .font(FlightPathFonts.body())
                    .foregroundColor(FlightPathTheme.Text.secondary)
            }
            .padding()
        }
    }
}
#endif
