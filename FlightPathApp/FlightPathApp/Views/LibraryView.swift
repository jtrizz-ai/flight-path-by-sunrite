import SwiftUI

struct LibraryView: View {
    @ObservedObject var viewModel: ModuleViewModel
    @State private var searchText = ""
    @State private var selectedTagIds = Set<String>()

    var filteredModules: [Module] {
        viewModel.filterModules(searchText: searchText, selectedTags: selectedTagIds)
    }

    var body: some View {
        List {
            // Tag Filter Section
            if !viewModel.allTags.isEmpty {
                Section {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(viewModel.allTags) { tag in
                                TagView(tag: tag, isSelected: selectedTagIds.contains(tag.id))
                                    .onTapGesture {
                                        toggleTag(tag.id)
                                    }
                            }
                        }
                        .padding(.vertical, 8)
                    }
                } header: {
                    Text("Filter by Tags")
                        .font(.headline)
                }
            }

            // Modules Section
            Section {
                if filteredModules.isEmpty {
                    ContentUnavailableView {
                        Label("No Modules Found", systemImage: "magnifyingglass")
                    } description: {
                        Text("Try adjusting your search or filters")
                    }
                } else {
                    ForEach(filteredModules) { module in
                        NavigationLink(destination: ModuleDetailView(module: module)) {
                            ModuleCard(module: module)
                        }
                        .listRowInsets(.none)
                        .listRowSeparator(.hidden)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 4)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .searchable(text: $searchText, prompt: "Search modules...")
        .navigationTitle("Library")
        .navigationBarTitleDisplayMode(.large)
        .refreshable {
            await viewModel.loadModules()
            // Reset filters when refreshing
            searchText = ""
            selectedTagIds.removeAll()
        }
    }

    private func toggleTag(_ tagId: String) {
        if selectedTagIds.contains(tagId) {
            selectedTagIds.remove(tagId)
        } else {
            selectedTagIds.insert(tagId)
        }
    }
}

#Preview {
    NavigationStack {
        LibraryView(viewModel: ModuleViewModel())
    }
}
