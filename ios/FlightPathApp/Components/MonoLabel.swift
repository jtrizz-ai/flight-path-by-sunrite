import SwiftUI

// MARK: - Mono Label

struct MonoLabel: View {
    let text: String

    var body: some View {
        Text(text.uppercased())
            .font(FlightPathFonts.mono())
            .foregroundColor(FlightPathTheme.Text.secondary)
            .tracking(2.0) // Wide letter spacing
    }
}

// MARK: - Preview

#if DEBUG
struct MonoLabel_Previews: ViewProvider {
    static var previews: some View {
        VStack(spacing: FlightPathTheme.Spacing.s16) {
            MonoLabel(text: "last updated")
            MonoLabel(text: "flight path program")
            MonoLabel(text: "module")
        }
        .padding()
        .background(FlightPathTheme.Background.primary)
    }
}
#endif
