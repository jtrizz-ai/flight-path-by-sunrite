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
    @Published var messages: [ChatMessage] = []
    @Published var isTyping = false

    // Auth + profile
    @Published var isAuthenticated = false   // NO MORE DEV BYPASS
    @Published var isSigningIn = false
    @Published var user: UserProfile?
    @Published var signInError: String?

    var userInitials: String {
        let name = user?.fullName ?? ""
        return name.split(separator: " ")
            .compactMap { $0.first }
            .prefix(2)
            .map(String.init)
            .joined()
            .uppercased()
    }
    /// Used by AppHeader + SideDrawer before user profile loads.
    var displayUserName: String { user?.fullName ?? "—" }
    var displayUserEmail: String { user?.email ?? "" }

    private let api = APIClient.shared

    // ── Auth ────────────────────────────────────────────────────────────

    func signInWithGoogle() async {
        isSigningIn = true
        signInError = nil
        defer { isSigningIn = false }

        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootVC = windowScene.windows.first(where: \.isKeyWindow)?.rootViewController
        else {
            signInError = "Could not find the sign-in window."
            return
        }

        do {
            let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: rootVC)
            guard let idToken = result.user.idToken?.tokenString else {
                signInError = "Google did not return an ID token."
                return
            }
            let exchange = try await api.exchangeToken(googleIdToken: idToken)
            KeychainStore.save(token: exchange.token)
            user = exchange.user
            isAuthenticated = true
            await loadChatHistory()
        } catch let APIError.http(403, _) {
            signInError = "Your email isn't on the allowlist."
        } catch let APIError.http(401, _) {
            signInError = "Google sign-in could not be verified."
        } catch let APIError.network(_) {
            signInError = "Could not reach the backend. Check Settings → Backend URL."
        } catch {
            // User-cancelled Google sign-in lands here silently — don't surface as error.
        }
    }

    func restorePreviousSignIn() async {
        // Only restore if we have a backend token AND Google can restore prior sign-in.
        guard KeychainStore.loadToken() != nil,
              GIDSignIn.sharedInstance.hasPreviousSignIn() else { return }
        do {
            try await GIDSignIn.sharedInstance.restorePreviousSignIn()
            user = try? await api.fetchMe()
            if user != nil {
                isAuthenticated = true
                await loadChatHistory()
            } else {
                KeychainStore.clear()
            }
        } catch {
            KeychainStore.clear()
        }
    }

    func signOut() async {
        await api.signOut()
        GIDSignIn.sharedInstance.signOut()
        user = nil
        isAuthenticated = false
        messages = []
    }

    // ── Chat ────────────────────────────────────────────────────────────

    func loadChatHistory() async {
        do {
            let thread = try await api.fetchChatThread()
            messages = thread.messages.map { m in
                ChatMessage(
                    id: UUID(uuidString: m.id) ?? UUID(),
                    role: m.role == "user" ? .me : .ai,
                    text: m.content,
                    sources: m.sources
                )
            }
        } catch {
            // Leave messages empty on failure; user can still send new ones.
        }
    }

    func send(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        messages.append(ChatMessage(id: UUID(), role: .me, text: trimmed, sources: nil))
        isTyping = true
        Task {
            do {
                let resp = try await api.sendChat(message: trimmed)
                messages.append(ChatMessage(
                    id: UUID(),
                    role: .ai,
                    text: resp.answer,
                    sources: resp.sources
                ))
            } catch {
                messages.append(ChatMessage(
                    id: UUID(),
                    role: .ai,
                    text: "Sorry — I couldn't reach the Flight Path assistant. Try again in a moment.",
                    sources: nil
                ))
            }
            isTyping = false
        }
    }

    func select(_ newTab: AppTab) {
        withAnimation(.easeInOut(duration: 0.22)) {
            tab = newTab
        }
    }
}
