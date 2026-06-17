import SwiftUI

// MARK: - Hero Wordmark

struct HeroWordmark: View {
    let text: String

    init(_ text: String) {
        self.text = text
    }

    var body: some View {
        Text(text)
            .font(FlightPathFonts.display(size: 44))
            .foregroundColor(FlightPathTheme.Text.primary)
            .lineLimit(1)
            .minimumScaleFactor(0.5)
    }
}

// MARK: - Preview

#if DEBUG
struct HeroWordmark_Previews: ViewProvider {
    static var previews: some View {
        VStack(spacing: FlightPathTheme.Spacing.s16) {
            HeroWordmark("FLIGHT PATH")
            HeroWordmark("PROGRAM")
        }
        .padding()
        .background(FlightPathTheme.Background.primary)
    }
}
#endif
