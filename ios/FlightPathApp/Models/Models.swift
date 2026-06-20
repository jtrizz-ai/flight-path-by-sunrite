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

// MARK: - Chat message (in-memory bubble)

struct ChatMessage: Identifiable {
    enum Role { case ai, me }

    let id: UUID
    let role: Role
    var text: String
    var sources: [ChatSource]?

    init(id: UUID = UUID(), role: Role, text: String, sources: [ChatSource]? = nil) {
        self.id = id
        self.role = role
        self.text = text
        self.sources = sources
    }

    var who: String { role == .ai ? "Flight Path AI" : "You" }
}

// MARK: - Tally metric

struct TallyMetric: Identifiable {
    let id = UUID()
    let label: String
    let goal: Int
}

// MARK: - API models (mirror web/src/lib/types/index.ts)

struct UserProfile: Codable, Equatable {
    let id: String
    let email: String
    var fullName: String
    var avatarUrl: String?
    var phone: String?
    var town: String?
    var hireDate: String?  // YYYY-MM-DD
    let role: String
    let status: String
}

struct UserProfilePatch: Codable {
    var fullName: String?
    var avatarUrl: String?
    var phone: String?
    var town: String?
    var hireDate: String?
}

struct ExchangeResponse: Codable {
    let token: String
    let expiresIn: Int
    let user: UserProfile
}

struct ChatSource: Codable, Identifiable, Equatable, Hashable {
    var id: String { pageId }
    let pageId: String
    let title: String
    let slug: String
    let snippet: String
}

struct ChatMessageRecord: Codable, Identifiable, Equatable {
    let id: String
    let role: String            // "user" or "assistant"
    let content: String
    let sources: [ChatSource]?
    let createdAt: String
}

struct ChatThread: Codable {
    let id: String
    let title: String
    let createdAt: String
    let updatedAt: String
    let messages: [ChatMessageRecord]
}

struct ChatResponse: Codable {
    let answer: String
    let sources: [ChatSource]?
}

struct HealthResponse: Codable {
    let ok: Bool
    let model: String?
    let error: String?
}

struct ApiError: Codable {
    let error: String?
}

// Tiny helpers for the wrapper response shapes used by /api/me etc.
struct MeResponse: Codable { let user: UserProfile }

// ── Tally ──────────────────────────────────────────────────────────────
struct TallyTotals: Codable, Equatable {
    var doors: Int = 0
    var conversations: Int = 0
    var appointments: Int = 0
}

struct TallyResponse: Codable {
    let totals: TallyTotals
}

// ── Badges ─────────────────────────────────────────────────────────────
struct EarnedBadge: Codable, Identifiable, Equatable {
    var id: String { slug + (quarter.map(String.init) ?? "") + (year.map(String.init) ?? "") }
    let slug: String
    let name: String
    let description: String?
    let isQuarterly: Bool
    let quarter: Int?
    let year: Int?
    let awardedAt: String

    enum CodingKeys: String, CodingKey {
        case slug, name, description
        case isQuarterly = "is_quarterly"
        case quarter, year
        case awardedAt = "awarded_at"
    }
}

struct BadgesResponse: Codable {
    let badges: [EarnedBadge]
}
struct ThreadResponse: Codable { let thread: ChatThread }
