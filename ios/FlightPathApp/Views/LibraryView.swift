import SwiftUI

struct LibraryView: View {
    @StateObject private var viewModel = FlightPathViewModel()
    @State private var searchText = ""
    @State private var isRefreshing = false

    var filteredPages: [FlightPathPage] {
        if searchText.isEmpty {
            return viewModel.pages
        } else {
            return viewModel.pages.filter { page in
                page.title.localizedCaseInsensitiveContains(searchText)
            }
        }
    }

    var body: some View {
        FlightPathBackground {
            NavigationStack {
                Group {
                    if viewModel.isLoading && viewModel.pages.isEmpty {
                        loadingView
                    } else if filteredPages.isEmpty {
                        emptyView
                    } else {
                        pagesList
                    }
                }
                .navigationTitle("Content Library")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button {
                            Task {
                                await refresh()
                            }
                        } label: {
                            Image(systemName: "arrow.clockwise")
                                .foregroundColor(FlightPathTheme.Text.primary)
                        }
                    }
                }
                .refreshable {
                    await refresh()
                }
            }
        }
        .onAppear {
            if viewModel.pages.isEmpty {
                Task {
                    await viewModel.loadPages()
                }
            }
        }
    }

    private var loadingView: some View {
        VStack(spacing: FlightPathTheme.Spacing.s24) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: FlightPathTheme.Accent.primary))
            Text("Loading content...")
                .font(FlightPathFonts.body())
                .foregroundColor(FlightPathTheme.Text.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.top, 100)
    }

    private var emptyView: some View {
        VStack(spacing: FlightPathTheme.Spacing.s24) {
            Image(systemName: "book.closed")
                .font(.system(size: 48))
                .foregroundColor(FlightPathTheme.Text.tertiary)

            Text("No Content Available")
                .font(FlightPathFonts.heading())
                .foregroundColor(FlightPathTheme.Text.primary)

            Text("Check back soon for new content")
                .font(FlightPathFonts.body())
                .foregroundColor(FlightPathTheme.Text.secondary)

            if viewModel.currentUser?.isPremium == false {
                premiumUpgradePrompt
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.top, 100)
    }

    private var premiumUpgradePrompt: some View {
        VStack(spacing: FlightPathTheme.Spacing.s16) {
            VStack(spacing: FlightPathTheme.Spacing.s8) {
                HStack {
                    Image(systemName: "lock.fill")
                        .foregroundColor(FlightPathTheme.Accent.primary)
                    Text("Premium Content Available")
                        .font(FlightPathFonts.body())
                        .foregroundColor(FlightPathTheme.Accent.primary)
                }

                Text("Upgrade to access exclusive content and features")
                    .font(FlightPathFonts.body(size: 14))
                    .foregroundColor(FlightPathTheme.Text.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(FlightPathTheme.Spacing.s16)
            .background(FlightPathTheme.Background.secondary)
            .cornerRadius(FlightPathTheme.Radius.medium)
        }
    }

    private var pagesList: some View {
        List {
            Section {
                ForEach(filteredPages) { page in
                    NavigationLink(destination: PageDetailView(page: page)) {
                        PageCard(page: page)
                    }
                    .listRowInsets(.none)
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
                    .padding(.horizontal, FlightPathTheme.Spacing.s16)
                    .padding(.vertical, FlightPathTheme.Spacing.s4)
                }
            } header: {
                if !filteredPages.isEmpty {
                    MonoLabel(text: "ALL PAGES")
                }
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .searchable(text: $searchText, prompt: "Search pages...")
    }

    private func refresh() async {
        isRefreshing = true
        defer { isRefreshing = false }

        await viewModel.loadPages()
    }
}

// MARK: - Page Card Component
struct PageCard: View {
    let page: FlightPathPage

    var body: some View {
        FlightPathCard {
            VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s12) {
                // Header with icon and title
                HStack {
                    if let icon = page.icon {
                        Text(icon)
                            .font(.system(size: 24))
                    }

                    VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s4) {
                        Text(page.title)
                            .font(FlightPathFonts.heading())
                            .foregroundColor(FlightPathTheme.Text.primary)

                        if page.is_hidden {
                            HStack(spacing: FlightPathTheme.Spacing.s4) {
                                Image(systemName: "lock.fill")
                                    .font(.system(size: 10))
                                    .foregroundColor(FlightPathTheme.Accent.primary)
                                Text("Premium")
                                    .font(FlightPathFonts.body(size: 10))
                                    .foregroundColor(FlightPathTheme.Accent.primary)
                            }
                            .padding(FlightPathTheme.Spacing.s4)
                            .background(FlightPathTheme.Accent.primary.opacity(0.1))
                            .cornerRadius(FlightPathTheme.Radius.small)
                        }
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.system(size: 12))
                        .foregroundColor(FlightPathTheme.Text.tertiary)
                }

                // Cover image preview
                if let cover = page.cover, let url = URL(string: cover) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .empty:
                            Rectangle()
                                .fill(FlightPathTheme.Background.secondary)
                        case .success(let image):
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                        case .failure:
                            Rectangle()
                                .fill(FlightPathTheme.Background.secondary)
                                .overlay(
                                    Image(systemName: "photo")
                                        .foregroundColor(FlightPathTheme.Text.tertiary)
                                )
                        @unknown default:
                            Rectangle()
                                .fill(FlightPathTheme.Background.secondary)
                        }
                    }
                    .frame(height: 120)
                    .cornerRadius(FlightPathTheme.Radius.small)
                    .clipped()
                }

                // Metadata
                HStack(spacing: FlightPathTheme.Spacing.s8) {
                    Image(systemName: "clock")
                        .font(.system(size: 10))
                        .foregroundColor(FlightPathTheme.Text.tertiary)
                    Text("Updated \(timeAgoString(from: page.updated_at))")
                        .font(FlightPathFonts.body(size: 12))
                        .foregroundColor(FlightPathTheme.Text.secondary)
                }
            }
            .padding(FlightPathTheme.Spacing.s16)
        }
    }

    private func timeAgoString(from dateString: String) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated

        guard let date = ISO8601DateFormatter().date(from: dateString) else {
            return "Unknown"
        }

        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

#Preview {
    LibraryView()
}