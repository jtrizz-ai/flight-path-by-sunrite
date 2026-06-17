import SwiftUI

struct ModuleDetailView: View {
    let module: Module
    @State private var loadedModule: Module?
    @State private var isLoadingContent = false
    @State private var errorMessage: String?

    var displayModule: Module {
        loadedModule ?? module
    }

    var body: some View {
        FlightPathBackground {
            List {
                // Header Section
                Section {
                    VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s12) {
                        // Title
                        Text(displayModule.title)
                            .font(FlightPathFonts.display(size: 28))
                            .foregroundColor(FlightPathTheme.Text.primary)

                        // Tags
                        if !displayModule.tags.isEmpty {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: FlightPathTheme.Spacing.s8) {
                                    ForEach(displayModule.tags) { tag in
                                        TagView(tag: tag)
                                    }
                                }
                            }
                        }

                        // Metadata
                        HStack(spacing: FlightPathTheme.Spacing.s16) {
                            HStack(spacing: FlightPathTheme.Spacing.s4) {
                                Image(systemName: "clock")
                                    .foregroundColor(FlightPathTheme.Text.tertiary)
                                Text(displayModule.formattedDate)
                                    .font(FlightPathFonts.mono(size: 10))
                                    .foregroundColor(FlightPathTheme.Text.tertiary)
                            }

                            if displayModule.verified {
                                HStack(spacing: FlightPathTheme.Spacing.s4) {
                                    Image(systemName: "checkmark.seal.fill")
                                        .foregroundColor(FlightPathTheme.Accent.primary)
                                    Text("Verified")
                                        .font(FlightPathFonts.mono(size: 10))
                                        .foregroundColor(FlightPathTheme.Accent.primary)
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, FlightPathTheme.Spacing.s8)
                }

                // Content Section
                Section {
                    if isLoadingContent {
                        ProgressView("Loading content...")
                            .frame(maxWidth: .infinity, alignment: .center)
                            .foregroundColor(FlightPathTheme.Text.secondary)
                            .padding()
                    } else if let errorMessage = errorMessage {
                        VStack(spacing: FlightPathTheme.Spacing.s12) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(FlightPathTheme.Accent.primary)
                                Text("Failed to load content")
                                Text(errorMessage)
                                .font(FlightPathFonts.body())
                                .foregroundColor(FlightPathTheme.Text.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                    } else if let contentBlocks = displayModule.contentBlocks, !contentBlocks.isEmpty {
                        ForEach(contentBlocks) { block in
                            ContentBlockView(block: block)
                                .listRowInsets(.none)
                                .listRowSeparator(.hidden)
                                .listRowBackground(Color.clear)
                                .padding(.horizontal, FlightPathTheme.Spacing.s16)
                                .padding(.vertical, FlightPathTheme.Spacing.s4)
                        }
                    } else {
                        ContentUnavailableView {
                            Label("No Content", systemImage: "doc.text")
                                .foregroundColor(FlightPathTheme.Text.secondary)
                        } description: {
                            Text("This module doesn't have any content yet.")
                                .foregroundColor(FlightPathTheme.Text.tertiary)
                        }
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                    }

                    // Mark Complete Button (disabled for v1)
                    Button {
                        // TODO: Implement progress tracking in future versions
                    } label: {
                        HStack {
                            Image(systemName: "checkmark.circle")
                            Text("Mark Complete")
                        }
                        .font(FlightPathFonts.body())
                        .foregroundColor(FlightPathTheme.Text.tertiary)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(FlightPathTheme.Background.secondary)
                        .cornerRadius(FlightPathTheme.Radius.medium)
                        .overlay(
                            RoundedRectangle(cornerRadius: FlightPathTheme.Radius.medium)
                                .stroke(FlightPathTheme.Border.subtle, lineWidth: 1)
                        )
                    }
                    .disabled(true)
                    .padding(.horizontal, FlightPathTheme.Spacing.s16)
                    .padding(.top, FlightPathTheme.Spacing.s8)
                } header: {
                    MonoLabel(text: "Content")
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .navigationBarTitleDisplayMode(.inline)
            .task {
                // Load content if not already loaded
                if module.contentBlocks == nil {
                    isLoadingContent = true
                    errorMessage = nil
                    do {
                        loadedModule = try await APIService.shared.fetchModule(id: module.id)
                    } catch {
                        print("Error loading module content: \(error)")
                        errorMessage = error.localizedDescription
                    }
                    isLoadingContent = false
                } else {
                    loadedModule = module
                }
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
