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

    // Tally counters (persisted to backend)
    @Published var doors = 0
    @Published var conversations = 0
    @Published var appointments = 0
    @Published var tallyLoaded = false

    // Goals (mirrors the design's data-goal attributes)
    let doorsGoal = 40
    let conversationsGoal = 15
    let appointmentsGoal = 5

    // Badges
    @Published var badges: [EarnedBadge] = []

    // Chat
    @Published var messages: [ChatMessage] = []
    @Published var threads: [ChatThreadSummary] = []
    @Published var activeThreadId: String? = nil
    @Published var isTyping = false
    @Published var isLoadingThread = false

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
            await onAuthenticated()
        } catch APIError.http(403, _) {
            signInError = "Your email isn't on the allowlist."
        } catch APIError.http(401, _) {
            signInError = "Google sign-in could not be verified."
        } catch APIError.network(_) {
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
                await onAuthenticated()
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
        threads = []
        activeThreadId = nil
        badges = []
        doors = 0
        conversations = 0
        appointments = 0
        tallyLoaded = false
    }

    // ── Post-authentication bootstrap ──────────────────────────────────

    /// Called after successful sign-in or restore. Loads chat thread list,
    /// tally totals, badges, and tracks the app open.
    private func onAuthenticated() async {
        await loadThreads()
        // Resume the most recent conversation, if any (matches Claude.ai).
        if let newest = threads.first {
            await openThread(id: newest.id)
        }
        await loadTally()
        await loadBadges()
        api.trackAppOpen()
    }

    // ── Tally (persisted) ──────────────────────────────────────────────

    func loadTally() async {
        do {
            let totals = try await api.fetchTally()
            doors = totals.doors
            conversations = totals.conversations
            appointments = totals.appointments
        } catch { /* leave zeros */ }
        tallyLoaded = true
    }

    /// Increment a metric and persist to the backend. Optimistic update
    /// with revert on failure.
    func incrementTally(metric: String, delta: Int) {
        switch metric {
        case "doors":
            doors = max(0, doors + delta)
        case "conversations":
            conversations = max(0, conversations + delta)
        case "appointments":
            appointments = max(0, appointments + delta)
        default: return
        }
        let prevDoors = doors, prevConv = conversations, prevAppt = appointments
        Task {
            do {
                let totals = try await api.incrementTally(metric: metric, amount: delta)
                doors = totals.doors
                conversations = totals.conversations
                appointments = totals.appointments
            } catch {
                // Revert
                doors = prevDoors
                conversations = prevConv
                appointments = prevAppt
            }
        }
    }

    // ── Badges ─────────────────────────────────────────────────────────

    func loadBadges() async {
        do {
            badges = try await api.fetchBadges()
        } catch { /* leave empty */ }
    }

    // ── Chat ────────────────────────────────────────────────────────────

    /// Load the conversation list from the backend. Also lazily purges the
    /// user's stale threads (>= 45 days idle) — that purge happens server-side
    /// on every list call. Safe to call repeatedly.
    func loadThreads() async {
        do {
            threads = try await api.fetchChatThreads()
        } catch {
            // Leave existing list intact on failure.
        }
    }

    /// Open a thread by id, fetch its messages, and swap them into the
    /// active conversation. No-op if the id matches the active thread.
    func openThread(id: String) async {
        if activeThreadId == id && !messages.isEmpty { return }
        activeThreadId = id
        messages = []
        isLoadingThread = true
        defer { isLoadingThread = false }
        do {
            let thread = try await api.fetchChatThread(id: id)
            messages = thread.messages.map { m in
                ChatMessage(
                    id: UUID(uuidString: m.id) ?? UUID(),
                    role: m.role == "user" ? .me : .ai,
                    text: m.content,
                    sources: m.sources
                )
            }
        } catch {
            messages = []
        }
    }

    /// Begin a fresh conversation: clear active thread + message bubble state.
    /// The new thread row is created lazily on the first send.
    func startNewChat() {
        activeThreadId = nil
        messages = []
    }

    /// Delete a thread. If it was the active one, fall back to the most
    /// recent surviving thread (or start fresh).
    func deleteThread(id: String) async {
        let wasActive = (id == activeThreadId)
        threads.removeAll { $0.id == id }
        try? await api.deleteChatThread(id: id)
        if wasActive {
            if let newest = threads.first {
                await openThread(id: newest.id)
            } else {
                startNewChat()
            }
        }
        await loadThreads()
    }

    func send(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        messages.append(ChatMessage(id: UUID(), role: .me, text: trimmed, sources: nil))
        isTyping = true
        let targetThreadId = activeThreadId
        Task {
            do {
                let resp = try await api.sendChat(message: trimmed, threadId: targetThreadId)
                // Track the (possibly newly-created) thread id.
                if let newId = resp.threadId, newId != activeThreadId {
                    activeThreadId = newId
                }
                messages.append(ChatMessage(
                    id: UUID(),
                    role: .ai,
                    text: resp.answer,
                    sources: resp.sources
                ))
                // Refresh sidebar previews (title, message count, last preview).
                await loadThreads()
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
        api.trackPageView(path: "/flight-path?tab=\(newTab.rawValue)", title: newTab.rawValue)
    }
}
