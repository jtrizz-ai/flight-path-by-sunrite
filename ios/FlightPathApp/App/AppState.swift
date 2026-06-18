import SwiftUI

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

    // Profile (static for this build — wired to backend later)
    let userName = "Jonathan Rizzo"
    let userEmail = "jrizzo@sunritesolarllc.com"
    var userInitials: String {
        userName.split(separator: " ").compactMap { $0.first }.prefix(2).map(String.init).joined()
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
