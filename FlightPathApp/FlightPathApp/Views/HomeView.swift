import SwiftUI

struct HomeView: View {
    @StateObject private var viewModel = ModuleViewModel()
    @State private var navigateToLibrary = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Welcome Header
                    VStack(spacing: 12) {
                        Image(systemName: "airplane.departure")
                            .font(.system(size: 60))
                            .foregroundStyle(.blue.gradient)

                        Text("Flight Path")
                            .font(.largeTitle)
                            .fontWeight(.bold)

                        Text("Your journey to excellence starts here")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 32)

                    // Browse Button
                    Button {
                        navigateToLibrary = true
                    } label: {
                        HStack {
                            Image(systemName: "book.fill")
                            Text("Browse Program")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(.blue)
                        .foregroundStyle(.white)
                        .cornerRadius(12)
                    }
                    .padding(.horizontal, 24)

                    // Recently Updated Section
                    if !viewModel.recentModules.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Recently Updated")
                                .font(.headline)
                                .padding(.horizontal, 24)

                            ForEach(viewModel.recentModules) { module in
                                NavigationLink(destination: ModuleDetailView(module: module)) {
                                    ModuleCard(module: module)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    // Connection Status
                    if !viewModel.isBackendConnected {
                        HStack(spacing: 12) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(.orange)
                            Text("Backend connection unavailable")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.horizontal, 24)
                    }
                }
                .padding(.vertical, 16)
            }
            .navigationTitle("Home")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: SettingsView(viewModel: viewModel)) {
                        Image(systemName: "gearshape")
                    }
                }
            }
            .navigationDestination(isPresented: $navigateToLibrary) {
                LibraryView(viewModel: viewModel)
            }
            .task {
                await viewModel.loadModules()
            }
            .overlay {
                if viewModel.isLoading {
                    ProgressView("Loading...")
                }
            }
        }
    }
}

#Preview {
    HomeView()
}
