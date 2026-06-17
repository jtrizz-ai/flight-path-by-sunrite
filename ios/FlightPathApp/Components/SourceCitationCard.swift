import SwiftUI

// MARK: - Source Citation Card
struct SourceCitationCard: View {
    let source: Source
    var onTap: (() -> Void)?

    init(source: Source, onTap: (() -> Void)? = nil) {
        self.source = source
        self.onTap = onTap
    }

    var body: some View {
        Button(action: {
            onTap?()
        }) {
            VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s4) {
                Text(source.title)
                    .font(FlightPathFonts.body(size: 12))
                    .foregroundColor(FlightPathTheme.Text.secondary)
                    .lineLimit(1)

                Text(source.snippet)
                    .font(FlightPathFonts.body(size: 10))
                    .foregroundColor(FlightPathTheme.Text.tertiary)
                    .lineLimit(2)
            }
            .padding(FlightPathTheme.Spacing.s8)
            .background(FlightPathTheme.Background.secondary.opacity(0.5))
            .cornerRadius(FlightPathTheme.Radius.small)
            .overlay(
                RoundedRectangle(cornerRadius: FlightPathTheme.Radius.small)
                    .stroke(FlightPathTheme.Border.subtle, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Preview
#if DEBUG
struct SourceCitationCard_Previews: ViewProvider {
    static var previews: some View {
        VStack(spacing: FlightPathTheme.Spacing.s8) {
            SourceCitationCard(source: Source(fromAPIResponse: APIService.Source(
                moduleId: "1",
                title: "Leadership Fundamentals",
                snippet: "Effective leadership starts with clear communication and strategic thinking..."
            )))

            SourceCitationCard(source: Source(fromAPIResponse: APIService.Source(
                moduleId: "2",
                title: "Team Management",
                snippet: "Building high-performing teams requires trust, clear goals..."
            )))
        }
        .padding()
        .background(FlightPathTheme.Background.primary)
    }
}
#endif
