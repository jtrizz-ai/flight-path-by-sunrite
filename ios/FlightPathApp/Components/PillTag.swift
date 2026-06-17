import SwiftUI

// MARK: - Pill Tag

struct PillTag: View {
    let text: String
    var isSelected: Bool = false

    var body: some View {
        Text(text)
            .font(FlightPathFonts.mono(size: 10))
            .foregroundColor(isSelected ? FlightPathTheme.Background.primary : FlightPathTheme.Text.secondary)
            .padding(.horizontal, FlightPathTheme.Spacing.s12)
            .padding(.vertical, FlightPathTheme.Spacing.s6)
            .background(
                ZStack {
                    if isSelected {
                        FlightPathTheme.Accent.primary
                    } else {
                        FlightPathTheme.Border.subtle
                    }
                }
            )
            .cornerRadius(FlightPathTheme.Radius.circle)
            .overlay(
                RoundedRectangle(cornerRadius: FlightPathTheme.Radius.circle)
                    .stroke(FlightPathTheme.Border.subtle, lineWidth: 1)
                    .opacity(isSelected ? 0 : 1)
            )
    }
}

// MARK: - Preview

#if DEBUG
struct PillTag_Previews: ViewProvider {
    static var previews: some View {
        VStack(spacing: FlightPathTheme.Spacing.s16) {
            PillTag(text: "Leadership", isSelected: false)
            PillTag(text: "Strategy", isSelected: true)
            PillTag(text: "Communication", isSelected: false)
        }
        .padding()
        .background(FlightPathTheme.Background.primary)
    }
}
#endif
