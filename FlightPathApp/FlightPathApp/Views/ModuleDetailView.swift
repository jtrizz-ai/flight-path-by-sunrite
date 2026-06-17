import SwiftUI

struct ModuleDetailView: View {
    let module: Module
    @State private var loadedModule: Module?
    @State private var isLoadingContent = false

    var body: some View {
        List {
            // Header Section
            Section {
                VStack(alignment: .leading, spacing: 12) {
                    // Title
                    Text(module.title)
                        .font(.title2)
                        .fontWeight(.bold)

                    // Tags
                    if !module.tags.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(module.tags) { tag in
                                    TagView(tag: tag)
                                }
                            }
                        }
                    }

                    // Metadata
                    HStack(spacing: 16) {
                        Label(module.formattedDate, systemImage: "clock")
                            .font(.caption)

                        if module.verified {
                            Label("Verified", systemImage: "checkmark.seal.fill")
                                .font(.caption)
                                .foregroundStyle(.green)
                        }
                    }
                    .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 8)
            }

            // Content Section
            Section {
                if isLoadingContent {
                    ProgressView()
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                } else if let contentBlocks = loadedModule?.contentBlocks, !contentBlocks.isEmpty {
                    ForEach(contentBlocks) { block in
                        ContentBlockView(block: block)
                            .listRowInsets(.none)
                            .listRowSeparator(.hidden)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 4)
                    }
                } else if let contentBlocks = module.contentBlocks, !contentBlocks.isEmpty {
                    ForEach(contentBlocks) { block in
                        ContentBlockView(block: block)
                            .listRowInsets(.none)
                            .listRowSeparator(.hidden)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 4)
                    }
                } else {
                    ContentUnavailableView {
                        Label("No Content", systemImage: "doc.text")
                    } description: {
                        Text("This module doesn't have any content yet.")
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
                }
            } header: {
                Text("Content")
                    .font(.headline)
            }
        }
        .listStyle(.insetGrouped)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            // Load content if not already loaded
            if module.contentBlocks == nil {
                isLoadingContent = true
                do {
                    loadedModule = try await APIService.shared.fetchModule(id: module.id)
                } catch {
                    print("Error loading module content: \(error)")
                }
                isLoadingContent = false
            } else {
                loadedModule = module
            }
        }
    }
}

#Preview {
    NavigationStack {
        ModuleDetailView(module: Module(
            id: "123",
            title: "Sample Module",
            tags: [Tag(id: "1", name: "Onboarding", color: "blue")],
            lastEditedTime: ISO8601DateFormatter().string(from: Date()),
            verified: true,
            contentBlocks: [
                ContentBlock(type: .paragraph, text: "This is a sample paragraph"),
                ContentBlock(type: .heading_2, text: "Section Title", level: 2),
                ContentBlock(type: .bullet_list, text: "Bullet point item"),
            ]
        ))
    }
}
