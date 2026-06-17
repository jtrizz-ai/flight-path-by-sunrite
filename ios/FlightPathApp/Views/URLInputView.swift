import SwiftUI

struct URLInputView: View {
    @State private var notionURL: String = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var navigateToContent = false
    @State private var loadedPage: NotionPublicPage?

    // Environment to share loaded page with other views
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        FlightPathBackground {
            NavigationStack {
                VStack(spacing: FlightPathTheme.Spacing.s32) {
                    // Hero section
                    VStack(spacing: FlightPathTheme.Spacing.s12) {
                        HeroWordmark("FLIGHT PATH")
                        Text("Enter your published Notion page URL to get started")
                            .font(FlightPathFonts.body())
                            .foregroundColor(FlightPathTheme.Text.secondary)
                            .multilineTextAlignment(.center)
                    }

                    // URL Input
                    VStack(spacing: FlightPathTheme.Spacing.s16) {
                        MonoLabel(text: "NOTION PAGE URL")

                        VStack(spacing: FlightPathTheme.Spacing.s8) {
                            TextField("https://your-workspace.notion.site/Page-Name", text: $notionURL)
                                .font(FlightPathFonts.body())
                                .foregroundColor(FlightPathTheme.Text.primary)
                                .padding(FlightPathTheme.Spacing.s16)
                                .background(FlightPathTheme.Background.secondary)
                                .cornerRadius(FlightPathTheme.Radius.medium)
                                .overlay(
                                    RoundedRectangle(cornerRadius: FlightPathTheme.Radius.medium)
                                        .stroke(FlightPathTheme.Border.subtle, lineWidth: 1)
                                )
                                .autocapitalization(.none)
                                .keyboardType(.URL)

                            if let errorMessage = errorMessage {
                                HStack(spacing: FlightPathTheme.Spacing.s8) {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .foregroundColor(FlightPathTheme.Accent.primary)
                                    Text(errorMessage)
                                        .font(FlightPathFonts.body(size: 12))
                                        .foregroundColor(FlightPathTheme.Accent.primary)
                                }
                                .padding(FlightPathTheme.Spacing.s8)
                            }
                        }
                    }

                    // Load Button
                    Button {
                        loadNotionPage()
                    } label: {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: FlightPathTheme.Background.primary))
                            } else {
                                Image(systemName: "arrow.down.circle.fill")
                                Text("Load Page")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(FlightPathTheme.Spacing.s16)
                        .background(canLoad ? FlightPathTheme.Accent.primary : FlightPathTheme.Background.secondary)
                        .foregroundColor(canLoad ? FlightPathTheme.Background.primary : FlightPathTheme.Text.tertiary)
                        .cornerRadius(FlightPathTheme.Radius.medium)
                    }
                    .disabled(!canLoad || isLoading)

                    // Recent URLs
                    if !UserDefaults.standard.stringArray(forKey: "recentNotionURLs").isEmpty {
                        VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s12) {
                            MonoLabel(text: "RECENT PAGES")

                            VStack(spacing: FlightPathTheme.Spacing.s8) {
                                ForEach(recentURLs, id: \.self) { url in
                                    Button {
                                        notionURL = url
                                        loadNotionPage()
                                    } label: {
                                        HStack {
                                            Image(systemName: "clock.arrow.circlepath")
                                            Text(truncatedURL(url))
                                                .font(FlightPathFonts.body(size: 12))
                                                .foregroundColor(FlightPathTheme.Text.secondary)
                                            Spacer()
                                        }
                                        .padding(FlightPathTheme.Spacing.s12)
                                        .background(FlightPathTheme.Background.secondary)
                                        .cornerRadius(FlightPathTheme.Radius.small)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Spacer()
                }
                .padding(FlightPathTheme.Spacing.s24)
                .navigationTitle("Flight Path")
                .navigationBarTitleDisplayMode(.inline)
                .navigationDestination(isPresented: $navigateToContent) {
                    if let page = loadedPage {
                        ContentView(page: page, originalURL: notionURL)
                    }
                }
            }
        }
    }

    private var canLoad: Bool {
        !notionURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isLoading
    }

    private var recentURLs: [String] {
        UserDefaults.standard.stringArray(forKey: "recentNotionURLs") ?? []
    }

    private func truncatedURL(_ url: String) -> String {
        if url.count > 40 {
            return url.prefix(40) + "..."
        }
        return url
    }

    private func loadNotionPage() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                let response = try await APIService.shared.fetchPublicPage(url: notionURL)

                // Save to recent URLs
                saveToRecentURLs(notionURL)

                await MainActor.run {
                    loadedPage = response.page
                    navigateToContent = true
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    isLoading = false
                }
            }
        }
    }

    private func saveToRecentURLs(_ url: String) {
        var recent = UserDefaults.standard.stringArray(forKey: "recentNotionURLs") ?? []

        // Remove if already exists
        recent.removeAll { $0 == url }

        // Add to front
        recent.insert(url, at: 0)

        // Keep only last 10
        if recent.count > 10 {
            recent = Array(recent.prefix(10))
        }

        UserDefaults.standard.set(recent, forKey: "recentNotionURLs")
    }
}

// MARK: - Content View (for loaded pages)
struct ContentView: View {
    let page: NotionPublicPage
    let originalURL: String
    @State private var selectedChildPage: NotionPublicPage?

    var body: some View {
        FlightPathBackground {
            List {
                // Page Content Section
                Section {
                    VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s12) {
                        Text(page.title)
                            .font(FlightPathFonts.display(size: 28))
                            .foregroundColor(FlightPathTheme.Text.primary)

                        MonoLabel(text: "PUBLISHED PAGE")
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, FlightPathTheme.Spacing.s8)
                }

                // Child Pages Section
                if !page.childPages.isEmpty {
                    Section {
                        ForEach(page.childPages, id: \.id) { childPage in
                            Button {
                                selectedChildPage = childPage
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s4) {
                                        Text(childPage.title)
                                            .font(FlightPathFonts.heading())
                                            .foregroundColor(FlightPathTheme.Text.primary)
                                        MonoLabel(text: "PAGE")
                                            .foregroundColor(FlightPathTheme.Text.tertiary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(FlightPathTheme.Text.tertiary)
                                }
                                .padding(FlightPathTheme.Spacing.s12)
                                .background(FlightPathTheme.Background.secondary)
                                .cornerRadius(FlightPathTheme.Radius.small)
                            }
                            .buttonStyle(.plain)
                        }
                    } header: {
                        MonoLabel(text: "SUB PAGES")
                    }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .navigationTitle(page.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        // TODO: Implement settings
                    } label: {
                        Image(systemName: "gearshape")
                            .foregroundColor(FlightPathTheme.Text.primary)
                    }
                }
            }
            .navigationDestination(isPresented: Binding(
                get: { selectedChildPage != nil },
                set: { if !$0 { selectedChildPage = nil } }
            )) {
                if let childPage = selectedChildPage {
                    // This would load the child page content
                    Text("Child page: \(childPage.title)")
                }
            }
        }
    }
}

// MARK: - Notion Public Page Model
struct NotionPublicPage: Identifiable, Codable {
    let id: String
    let title: String
    let url: String
    let childPages: [NotionPublicPage]
}

#Preview {
    URLInputView()
}
