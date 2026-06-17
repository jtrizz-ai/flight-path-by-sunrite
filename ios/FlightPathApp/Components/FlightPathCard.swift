import SwiftUI

// MARK: - Flight Path Card

struct FlightPathCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .background(FlightPathTheme.Background.secondary)
            .cornerRadius(FlightPathTheme.Radius.medium)
            .overlay(
                RoundedRectangle(cornerRadius: FlightPathTheme.Radius.medium)
                    .stroke(FlightPathTheme.Border.subtle, lineWidth: 1)
            )
            .shadow(
                color: Color.black.opacity(0.3),
                radius: 8,
                x: 0,
                y: 4
            )
    }
}

// MARK: - Preview

#if DEBUG
struct FlightPathCard_Previews: ViewProvider {
    static var previews: some View {
        FlightPathCard {
            VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s12) {
                Text("Module Title")
                    .font(FlightPathFonts.heading())
                    .foregroundColor(FlightPathTheme.Text.primary)

                Text("Module description goes here")
                    .font(FlightPathFonts.body())
                    .foregroundColor(FlightPathTheme.Text.secondary)
            }
            .padding()
        }
        .padding()
        .background(FlightPathTheme.Background.primary)
    }
}
#endif
