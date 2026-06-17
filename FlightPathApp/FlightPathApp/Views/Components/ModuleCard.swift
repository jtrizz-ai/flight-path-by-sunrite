import SwiftUI

struct ModuleCard: View {
    let module: Module

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Title and verified badge
            HStack {
                Text(module.title)
                    .font(.headline)
                    .lineLimit(2)
                    .foregroundStyle(.primary)

                Spacer()

                if module.verified {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.title3)
                        .foregroundStyle(.green)
                }
            }

            // Tags
            if !module.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(module.tags) { tag in
                            TagView(tag: tag, size: .small)
                        }
                    }
                }
            }

            // Metadata
            HStack {
                Label(module.formattedDate, systemImage: "clock")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Spacer()

                if module.hasContent {
                    Image(systemName: "doc.text.fill")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(16)
        .background(.ultraThinMaterial)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
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
    .background(Color(.systemGroupedBackground))
}
