import SwiftUI
import GoogleSignIn

// MARK: - App navigation tabs

enum AppTab: String, CaseIterable {
    case home, schedule, tally, chat
}

// MARK: - Global app state

@MainActor
final class AppState: ObservableObject {
    // Navigation
    @Published var tab: AppTab = .home
    @Published var drawerOpen = false

    // Tally counters
    @Published var doors = 0
    @Published var conversations = 0
    @Published var appointments = 0

    // Goals (mirrors the design's data-goal attributes)
    let doorsGoal = 40
    let conversationsGoal = 15
    let appointmentsGoal = 5

    // Chat
    @Published var messages: [ChatMessage] = ChatMessage.samples

    // Auth
    // TODO: Change back to false before shipping — dev bypass so the full shell is always visible
    @Published var isAuthenticated = true
    @Published var isSigningIn = false

    // Profile (static for this build — wired to backend later)
    let userName = "Jonathan Rizzo"
    let userEmail = "jrizzo@sunritesolarllc.com"
    var userInitials: String {
        userName.split(separator: " ").compactMap { $0.first }.prefix(2).map(String.init).joined()
    }

    func signInWithGoogle() async {
        isSigningIn = true
        defer { isSigningIn = false }

        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootVC = windowScene.windows.first(where: \.isKeyWindow)?.rootViewController
        else { return }

        do {
            let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: rootVC)
            // result.user.profile holds name/email/photo when needed
            _ = result.user
            isAuthenticated = true
        } catch {
            // User cancelled or auth error — stay on login screen
        }
    }

    func restorePreviousSignIn() async {
        do {
            try await GIDSignIn.sharedInstance.restorePreviousSignIn()
            isAuthenticated = true
        } catch {
            // No cached session; user will sign in manually
        }
    }

    func signOut() {
        GIDSignIn.sharedInstance.signOut()
        isAuthenticated = false
    }

    func select(_ newTab: AppTab) {
        withAnimation(.easeInOut(duration: 0.22)) {
            tab = newTab
        }
    }

    func send(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        messages.append(ChatMessage(role: .me, text: trimmed))
        // Placeholder assistant reply (live app answers from Flight Path content).
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.messages.append(ChatMessage(
                role: .ai,
                text: "Thanks! This is a preview of the Flight Path assistant. In the live app it answers from your Flight Path Program content."
            ))
        }
    }
}
