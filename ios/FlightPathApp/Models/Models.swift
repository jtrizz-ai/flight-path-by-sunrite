import Foundation

// MARK: - Schedule module (Schedule tab list rows)

struct ScheduleModule: Identifiable {
    let id = UUID()
    let index: String
    let title: String
    let subtitle: String

    static let all: [ScheduleModule] = [
        .init(index: "01", title: "Flight Path Schedule",
              subtitle: "Onboarding · Week 1"),
        .init(index: "02", title: "RepCard Territory Management",
              subtitle: "Tools · Door to Door"),
        .init(index: "03", title: "The Door Pitch",
              subtitle: "Sales · Script"),
        .init(index: "04", title: "Recommended Reading & Content",
              subtitle: "Resources · Library")
    ]
}

// MARK: - Chat message

struct ChatMessage: Identifiable {
    enum Role { case ai, me }

    let id = UUID()
    let role: Role
    let text: String

    var who: String { role == .ai ? "Flight Path AI" : "You" }

    static let samples: [ChatMessage] = [
        .init(role: .ai, text: "Welcome to Flight Path, Jonathan. Ask me anything about the program — the Door Pitch, your Schedule, or RepCard."),
        .init(role: .me, text: "What is the goal for week one?"),
        .init(role: .ai, text: "Week one focuses on the Door Pitch and your daily Tally goals: 40 doors, 15 conversations, and 5 appointments. Open the Schedule tab to start.")
    ]
}

// MARK: - Tally metric

struct TallyMetric: Identifiable {
    let id = UUID()
    let label: String
    let goal: Int
}
