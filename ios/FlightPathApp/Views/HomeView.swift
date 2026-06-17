import SwiftUI

struct HomeView: View {
    @StateObject private var viewModel = FlightPathViewModel()
    @State private var navigateToLibrary = false
    @State private var navigateToSettings = false
    @State private var isSigningIn = false

    var body: some View {
        FlightPathBackground {
            NavigationStack {
                ScrollView {
                    VStack(spacing: FlightPathTheme.Spacing.s24) {
                        // Welcome Header
                        VStack(spacing: FlightPathTheme.Spacing.s12) {
                            HeroWordmark("FLIGHT PATH")

                            if let user = viewModel.currentUser {
                                Text("Welcome back, \(user.firstName ?? "Traveler")!")
                                    .font(FlightPathFonts.body())
                                    .foregroundColor(FlightPathTheme.Text.secondary)
                            } else {
                                Text("Your premium content platform")
                                    .font(FlightPathFonts.body())
                                    .foregroundColor(FlightPathTheme.Text.secondary)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(FlightPathTheme.Spacing.s32)

                        // Auth Section (if not logged in)
                        if viewModel.currentUser == nil {
                            VStack(spacing: FlightPathTheme.Spacing.s16) {
                                // Sign In Button
                                Button {
                                    Task {
                                        await signInWithGoogle()
                                    }
                                } label: {
                                    HStack {
                                        if isSigningIn {
                                            ProgressView()
                                                .progressViewStyle(CircularProgressViewStyle(tint: FlightPathTheme.Background.primary))
                                        } else {
                                            Image(systemName: "google.logo")
                                            Text("Sign in with Google")
                                                .font(FlightPathFonts.body())
                                        }
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(FlightPathTheme.Spacing.s16)
                                    .background(FlightPathTheme.Accent.primary)
                                    .foregroundColor(FlightPathTheme.Background.primary)
                                    .cornerRadius(FlightPathTheme.Radius.medium)
                                }
                                .disabled(isSigningIn)

                                Text("Access exclusive content and features")
                                    .font(FlightPathFonts.body(size: 12))
                                    .foregroundColor(FlightPathTheme.Text.tertiary)
                            }
                            .padding(FlightPathTheme.Spacing.s24)
                            .background(FlightPathTheme.Background.secondary)
                            .cornerRadius(FlightPathTheme.Radius.medium)
                        }

                        // Stats Section (if logged in)
                        if viewModel.currentUser != nil {
                            VStack(spacing: FlightPathTheme.Spacing.s16) {
                                MonoLabel(text: "YOUR STATUS")

                                HStack(spacing: FlightPathTheme.Spacing.s16) {
                                    VStack(spacing: FlightPathTheme.Spacing.s8) {
                                        Text("\(viewModel.totalPages)")
                                            .font(FlightPathFonts.display(size: 32))
                                            .foregroundColor(FlightPathTheme.Text.primary)
                                        Text("Total Pages")
                                            .font(FlightPathFonts.body(size: 12))
                                            .foregroundColor(FlightPathTheme.Text.secondary)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(FlightPathTheme.Spacing.s16)
                                    .background(FlightPathTheme.Background.secondary)
                                    .cornerRadius(FlightPathTheme.Radius.medium)

                                    VStack(spacing: FlightPathTheme.Spacing.s8) {
                                        Text("\(viewModel.hiddenPages)")
                                            .font(FlightPathFonts.display(size: 32))
                                            .foregroundColor(FlightPathTheme.Accent.primary)
                                        Text("Premium")
                                            .font(FlightPathFonts.body(size: 12))
                                            .foregroundColor(FlightPathTheme.Text.secondary)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(FlightPathTheme.Spacing.s16)
                                    .background(FlightPathTheme.Background.secondary)
                                    .cornerRadius(FlightPathTheme.Radius.medium)
                                }
                            }
                            .frame(maxWidth: .infinity)

                            // Subscription Badge
                            if viewModel.currentUser?.isPremium == true {
                                HStack {
                                    Image(systemName: "crown.fill")
                                        .foregroundColor(FlightPathTheme.Accent.primary)
                                    Text("Premium Access Active")
                                        .font(FlightPathFonts.body())
                                        .foregroundColor(FlightPathTheme.Accent.primary)
                                }
                                .padding(FlightPathTheme.Spacing.s12)
                                .background(FlightPathTheme.Accent.primary.opacity(0.1))
                                .cornerRadius(FlightPathTheme.Radius.small)
                            }
                        }

                        // Action Buttons
                        VStack(spacing: FlightPathTheme.Spacing.s16) {
                            // Browse Button
                            if viewModel.currentUser != nil {
                                Button {
                                    navigateToLibrary = true
                                } label: {
                                    HStack {
                                        Image(systemName: "book.fill")
                                        Text("Browse Content")
                                            .font(FlightPathFonts.body())
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(FlightPathTheme.Spacing.s16)
                                    .background(FlightPathTheme.Accent.primary)
                                    .foregroundColor(FlightPathTheme.Background.primary)
                                    .cornerRadius(FlightPathTheme.Radius.medium)
                                }
                            } else {
                                // Disabled state for non-logged users
                                HStack {
                                    Image(systemName: "book.fill")
                                    Text("Browse Content")
                                        .font(FlightPathFonts.body())
                                }
                                .frame(maxWidth: .infinity)
                                .padding(FlightPathTheme.Spacing.s16)
                                .background(FlightPathTheme.Background.secondary)
                                .foregroundColor(FlightPathTheme.Text.tertiary)
                                .cornerRadius(FlightPathTheme.Radius.medium)
                            }

                            // Settings Button
                            Button {
                                navigateToSettings = true
                            } label: {
                                HStack {
                                    Image(systemName: "gearshape.fill")
                                    Text("Settings")
                                        .font(FlightPathFonts.body())
                                }
                                .frame(maxWidth: .infinity)
                                .padding(FlightPathTheme.Spacing.s16)
                                .background(FlightPathTheme.Background.secondary)
                                .foregroundColor(FlightPathTheme.Text.primary)
                                .overlay(
                                    RoundedRectangle(cornerRadius: FlightPathTheme.Radius.medium)
                                        .stroke(FlightPathTheme.Border.subtle, lineWidth: 1)
                                )
                                .cornerRadius(FlightPathTheme.Radius.medium)
                            }
                        }

                        // Connection Status
                        if let status = viewModel.connectionStatus {
                            HStack(spacing: FlightPathTheme.Spacing.s8) {
                                Circle()
                                    .fill(status.isConnected ? Color.green : Color.red)
                                    .frame(width: 8, height: 8)

                                Text(status.isConnected ? "Connected" : "Disconnected")
                                    .font(FlightPathFonts.body(size: 12))
                                    .foregroundColor(FlightPathTheme.Text.secondary)
                            }
                            .padding(FlightPathTheme.Spacing.s12)
                            .background(status.isConnected ? FlightPathTheme.Background.secondary : FlightPathTheme.Background.secondary.opacity(0.5))
                            .cornerRadius(FlightPathTheme.Radius.small)
                        }
                    }
                    .padding(FlightPathTheme.Spacing.s24)
                }
                .navigationTitle("Flight Path")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        if let user = viewModel.currentUser {
                            Menu {
                                Button(action: {
                                    Task {
                                        await viewModel.signOut()
                                    }
                                }) {
                                    HStack {
                                        Text("Sign Out")
                                        Image(systemName: "arrow.right.square")
                                    }
                                }

                                Button(action: {
                                    navigateToSettings = true
                                }) {
                                    HStack {
                                        Text("Settings")
                                        Image(systemName: "gearshape")
                                    }
                                }
                            } label: {
                                HStack(spacing: 8) {
                                    Text(user.firstName ?? "User")
                                        .font(FlightPathFonts.body())
                                    Circle()
                                        .fill(FlightPathTheme.Accent.primary)
                                        .frame(width: 32, height: 32)
                                        .overlay {
                                            Text(String(user.firstName?.prefix(1).uppercased() ?? "U"))
                                                .font(FlightPathFonts.body(size: 14))
                                                .foregroundColor(FlightPathTheme.Background.primary)
                                        }
                                }
                            }
                        } else {
                            Button("Sign In") {
                                Task {
                                    await signInWithGoogle()
                                }
                            }
                        }
                    }
                }
                .navigationDestination(isPresented: $navigateToLibrary) {
                    LibraryView()
                }
                .navigationDestination(isPresented: $navigateToSettings) {
                    SettingsView()
                }
            }
        }
        .onAppear {
            Task {
                await viewModel.loadUserData()
            }
        }
    }

    private func signInWithGoogle() async {
        isSigningIn = true
        defer {
            isSigningIn = false
        }

        do {
            let success = try await SupabaseService.shared.signInWithGoogle()
            if success {
                await viewModel.loadUserData()
            }
        } catch {
            print("Sign in error: \(error)")
        }
    }
}

#Preview {
    HomeView()
}