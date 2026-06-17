import SwiftUI

struct SettingsView: View {
    @StateObject private var viewModel = FlightPathViewModel()
    @State private var isCheckingConnection = false
    @State private var isSigningOut = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        FlightPathBackground {
            NavigationStack {
                List {
                    // User Profile Section
                    if let user = viewModel.currentUser {
                        Section {
                            VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s16) {
                                HStack(spacing: FlightPathTheme.Spacing.s12) {
                                    // Avatar
                                    Circle()
                                        .fill(FlightPathTheme.Accent.primary)
                                        .frame(width: 60, height: 60)
                                        .overlay {
                                            Text(String(user.firstName?.prefix(1).uppercased() ?? "U"))
                                                .font(FlightPathFonts.display(size: 24))
                                                .foregroundColor(FlightPathTheme.Background.primary)
                                        }

                                    VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s4) {
                                        Text(user.fullName ?? "Flight Path User")
                                            .font(FlightPathFonts.heading())
                                            .foregroundColor(FlightPathTheme.Text.primary)

                                        Text(user.email ?? "")
                                            .font(FlightPathFonts.body())
                                            .foregroundColor(FlightPathTheme.Text.secondary)
                                    }

                                    Spacer()
                                }

                                // Subscription Badge
                                HStack(spacing: FlightPathTheme.Spacing.s8) {
                                    Image(systemName: "crown.fill")
                                        .foregroundColor(user.isPremium ? FlightPathTheme.Accent.primary : FlightPathTheme.Text.tertiary)
                                    Text(user.subscriptionTier.capitalized)
                                        .font(FlightPathFonts.body())
                                        .foregroundColor(user.isPremium ? FlightPathTheme.Accent.primary : FlightPathTheme.Text.secondary)
                                }
                                .padding(FlightPathTheme.Spacing.s8)
                                .background(user.isPremium ? FlightPathTheme.Accent.primary.opacity(0.1) : FlightPathTheme.Background.secondary)
                                .cornerRadius(FlightPathTheme.Radius.small)
                            }
                            .padding(FlightPathTheme.Spacing.s16)
                        }
                    } else {
                        Section {
                            Button {
                                Task {
                                    await signInWithGoogle()
                                }
                            } label: {
                                HStack {
                                    Image(systemName: "person.badge.plus")
                                        .foregroundColor(FlightPathTheme.Accent.primary)
                                    Text("Sign In")
                                        .font(FlightPathFonts.body())
                                        .foregroundColor(FlightPathTheme.Text.primary)
                                }
                            }
                        }
                    }

                    // Connection Status Section
                    Section {
                        VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s8) {
                            HStack {
                                Image(systemName: (viewModel.connectionStatus?.isConnected ?? false) ? "checkmark.circle.fill" : "xmark.circle.fill")
                                    .font(.title3)
                                    .foregroundColor((viewModel.connectionStatus?.isConnected ?? false) ? Color.green : FlightPathTheme.Accent.primary)

                                Text("Connection Status")
                                    .font(FlightPathFonts.heading())
                            }

                            if let status = viewModel.connectionStatus {
                                Text(status.isConnected ? "Connected to Flight Path" : status.message)
                                    .font(FlightPathFonts.body())
                                    .foregroundColor(FlightPathTheme.Text.secondary)
                            } else {
                                Text("Checking connection...")
                                    .font(FlightPathFonts.body())
                                    .foregroundColor(FlightPathTheme.Text.tertiary)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    } header: {
                        MonoLabel(text: "BACKEND")
                    }

                    // Content Statistics
                    if viewModel.currentUser != nil {
                        Section {
                            HStack {
                                VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s4) {
                                    Text("\(viewModel.totalPages)")
                                        .font(FlightPathFonts.display(size: 28))
                                        .foregroundColor(FlightPathTheme.Text.primary)
                                    Text("Total Pages")
                                        .font(FlightPathFonts.body(size: 12))
                                        .foregroundColor(FlightPathTheme.Text.secondary)
                                }

                                Spacer()

                                VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s4) {
                                    Text("\(viewModel.hiddenPages)")
                                        .font(FlightPathFonts.display(size: 28))
                                        .foregroundColor(FlightPathTheme.Accent.primary)
                                    Text("Premium Pages")
                                        .font(FlightPathFonts.body(size: 12))
                                        .foregroundColor(FlightPathTheme.Text.secondary)
                                }
                            }
                            .padding(FlightPathTheme.Spacing.s16)
                        } header: {
                            MonoLabel(text: "STATISTICS")
                        }
                    }

                    // Actions Section
                    Section {
                        // Refresh Button
                        Button {
                            Task {
                                await refreshData()
                            }
                        } label: {
                            HStack {
                                Image(systemName: "arrow.clockwise")
                                    .foregroundColor(FlightPathTheme.Text.primary)
                                Text("Refresh Data")
                                    .font(FlightPathFonts.body())
                                    .foregroundColor(FlightPathTheme.Text.primary)
                                Spacer()
                                if viewModel.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: FlightPathTheme.Accent.primary))
                                }
                            }
                        }
                        .disabled(viewModel.isLoading)

                        // Check Connection Button
                        Button {
                            Task {
                                await checkConnection()
                            }
                        } label: {
                            HStack {
                                Image(systemName: "network")
                                    .foregroundColor(FlightPathTheme.Text.primary)
                                Text("Check Connection")
                                    .font(FlightPathFonts.body())
                                    .foregroundColor(FlightPathTheme.Text.primary)
                                Spacer()
                                if isCheckingConnection {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: FlightPathTheme.Accent.primary))
                                }
                            }
                        }
                        .disabled(isCheckingConnection)

                        // Sign Out Button
                        if viewModel.currentUser != nil {
                            Button {
                                Task {
                                    await signOut()
                                }
                            } label: {
                                HStack {
                                    Image(systemName: "arrow.right.square")
                                        .foregroundColor(FlightPathTheme.Accent.primary)
                                    Text("Sign Out")
                                        .font(FlightPathFonts.body())
                                        .foregroundColor(FlightPathTheme.Accent.primary)
                                    Spacer()
                                    if isSigningOut {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: FlightPathTheme.Background.primary))
                                    }
                                }
                            }
                            .disabled(isSigningOut)
                        }
                    } header: {
                        MonoLabel(text: "ACTIONS")
                    }

                    // App Info Section
                    Section {
                        VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s12) {
                            InfoRow(label: "App Version", value: "1.0.0")
                            InfoRow(label: "Build", value: "Production")
                            InfoRow(label: "Platform", value: "iOS 17+")
                        }
                    } header: {
                        MonoLabel(text: "ABOUT")
                    }
                }
                .listStyle(.insetGrouped)
                .scrollContentBackground(.hidden)
                .navigationTitle("Settings")
                .navigationBarTitleDisplayMode(.inline)
            }
        }
        .onAppear {
            Task {
                await checkConnection()
            }
        }
    }

    private func refreshData() async {
        await viewModel.refreshData()
    }

    private func checkConnection() async {
        isCheckingConnection = true
        defer { isCheckingConnection = false }

        await viewModel.checkConnection()
    }

    private func signInWithGoogle() async {
        do {
            let success = try await SupabaseService.shared.signInWithGoogle()
            if success {
                await viewModel.loadUserData()
            }
        } catch {
            print("Sign in error: \(error)")
        }
    }

    private func signOut() async {
        isSigningOut = true
        defer { isSigningOut = false }

        await viewModel.signOut()
    }
}

struct InfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(FlightPathFonts.body(size: 12))
                .foregroundColor(FlightPathTheme.Text.secondary)

            Spacer()

            Text(value)
                .font(FlightPathFonts.body(size: 12))
                .foregroundColor(FlightPathTheme.Text.primary)
        }
    }
}

#Preview {
    SettingsView()
}