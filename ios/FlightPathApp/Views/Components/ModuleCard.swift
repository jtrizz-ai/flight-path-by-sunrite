import SwiftUI

struct ModuleCard: View {
    let module: Module

    var body: some View {
        FlightPathCard {
            VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s12) {
                // Title and verified badge
                HStack {
                    Text(module.title)
                        .font(FlightPathFonts.heading())
                        .lineLimit(2)
                        .foregroundColor(FlightPathTheme.Text.primary)

                    Spacer()

                    if module.verified {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.title3)
                            .foregroundColor(FlightPathTheme.Accent.primary)
                    }
                }

                // Tags
                if !module.tags.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: FlightPathTheme.Spacing.s8) {
                            ForEach(module.tags) { tag in
                                TagView(tag: tag, size: .small)
                            }
                        }
                    }
                }

                // Metadata
                HStack {
                    Label(module.formattedDate, systemImage: "clock")
                        .font(FlightPathFonts.mono(size: 10))
                        .foregroundColor(FlightPathTheme.Text.tertiary)

                    Spacer()

                    if module.hasContent {
                        Image(systemName: "doc.text.fill")
                            .font(.caption)
                            .foregroundColor(FlightPathTheme.Text.tertiary)
                    }
                }
            }
            .padding(FlightPathTheme.Spacing.s16)
        }
    }
}

#Preview {
    VStack {
        ModuleCard(module: Module(
            id: "1",
            title: "Getting Started with Flight Path",
            tags: [
                Tag(id: "1", name: "Onboarding", color: "blue"),
                Tag(id: "2", name: "Important", color: "red")
            ],
            lastEditedTime: ISO8601DateFormatter().string(from: Date()),
            verified: true,
            contentBlocks: []
        ))
        .padding()

        ModuleCard(module: Module(
            id: "2",
            title: "Advanced Design Principles",
            tags: [
                Tag(id: "3", name: "Design", color: "orange")
            ],
            lastEditedTime: ISO8601DateFormatter().string(from: Date().addingTimeInterval(-86400)),
            verified: false,
            contentBlocks: [
                ContentBlock(type: .paragraph, text: "Some content")
            ]
        ))
        .padding()
    }
    .background(FlightPathTheme.Background.primary)
}
