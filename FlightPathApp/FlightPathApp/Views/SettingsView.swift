import SwiftUI

struct SettingsView: View {
    @ObservedObject var viewModel: ModuleViewModel
    @State private var isCheckingHealth = false
    @State private var healthMessage = ""
    @State private var showHealthMessage = false

    var formattedLastSync: String {
        guard let lastSync = viewModel.lastSyncTime else {
            return "Never"
        }

        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: lastSync, relativeTo: Date())
    }

    var body: some View {
        List {
            // Backend Connection Section
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: viewModel.isBackendConnected ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .font(.title3)
                            .foregroundStyle(viewModel.isBackendConnected ? .green : .red)

                        Text("Backend Status")
                            .font(.headline)
                    }

                    Text(viewModel.isBackendConnected ? "Connected" : "Disconnected")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 4)

                Button {
                    Task {
                        await checkHealth()
                    }
                } label: {
                    HStack {
                        if isCheckingHealth {
                            ProgressView()
                                .scaleEffect(0.8)
                        } else {
                            Text("Test Connection")
                                .fontWeight(.medium)
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            } header: {
                Text("Backend")
            }

            // Sync Information Section
            Section {
                HStack {
                    Label("Last Sync", systemImage: "clock.arrow.circlepath")
                    Spacer()
                    Text(formattedLastSync)
                        .foregroundStyle(.secondary)
                }

                if let errorMessage = viewModel.errorMessage {
                    HStack {
                        Label("Error", systemImage: "exclamationmark.triangle")
                            .foregroundStyle(.orange)
                        Spacer()
                        Text(errorMessage)
                            .foregroundStyle(.secondary)
                            .font(.caption)
                    }
                }
            } header: {
                Text("Sync Status")
            }

            // App Information Section
            Section {
                HStack {
                    Label("App Version", systemImage: "info.circle")
                    Spacer()
                    Text("1.0.0")
                        .foregroundStyle(.secondary)
                }

                HStack {
                    Label("Backend URL", systemImage: "server")
                    Spacer()
                    Text("localhost:3000")
                        .foregroundStyle(.secondary)
                        .font(.caption)
                }
            } header: {
                Text("About")
            } footer: {
                Text("Flight Path App connects to your Notion database to deliver learning content.")
                    .font(.caption)
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Connection Test", isPresented: $showHealthMessage) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(healthMessage)
        }
    }

    private func checkHealth() async {
        isCheckingHealth = true

        let isConnected = await viewModel.checkBackendHealth()

        isCheckingHealth = false

        if isConnected {
            healthMessage = "Backend connection successful!"
        } else {
            healthMessage = "Backend connection failed. Please check if the server is running."
        }

        showHealthMessage = true
    }
}

#Preview {
    NavigationStack {
        SettingsView(viewModel: ModuleViewModel())
    }
}
