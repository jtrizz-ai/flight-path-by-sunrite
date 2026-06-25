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

/// Lightweight row for the conversation list (GET /api/chat/threads).
/// `messages` is intentionally omitted; the client fetches a single thread
/// via /api/chat/threads/[id] when the user opens it.
struct ChatThreadSummary: Codable, Identifiable, Equatable {
    let id: String
    let title: String
    let createdAt: String
    let updatedAt: String
    let messageCount: Int
    let lastMessagePreview: String?

    enum CodingKeys: String, CodingKey {
        case id, title, createdAt, updatedAt
        case messageCount = "messageCount"
        case lastMessagePreview = "lastMessagePreview"
    }
}

struct ChatThreadListResponse: Codable {
    let threads: [ChatThreadSummary]
}

struct ChatResponse: Codable {
    let answer: String
    let sources: [ChatSource]?
    /// ID of the thread this answer belongs to. May be a freshly-created
    /// thread when the client sent without a threadId.
    let threadId: String?
    /// Title of the thread (useful when it was just derived from the first
    /// message and the sidebar needs to update without a re-fetch).
    let threadTitle: String?
    /// True iff a new thread row was created on this call.
    let isNewThread: Bool?
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

// ── Onboarding / Schedule ──────────────────────────────────────────────

/// Per-milestone completion state, synced with the backend.
struct MilestoneState: Codable, Equatable {
    var selfChecked: Bool
    var confirmedByManager: Bool
    var revokedByManager: Bool
    /// Generic sub-progress counter (knock sessions for 03, appts for 04).
    var sublineValue: Int?

    static let empty = MilestoneState(
        selfChecked: false,
        confirmedByManager: false,
        revokedByManager: false,
        sublineValue: nil
    )

    enum CodingKeys: String, CodingKey {
        case selfChecked        = "self_checked"
        case confirmedByManager = "confirmed_by_manager"
        case revokedByManager   = "revoked_by_manager"
        case sublineValue       = "subline_value"
    }
}

/// One day inside the rep's 40-day work plan.
struct WorkDay: Codable, Identifiable, Equatable {
    var id: String { date }
    let date: String        // YYYY-MM-DD
    var isWorking: Bool
    var startHour: Int?     // 0–23
    var endHour: Int?
    var note: String?

    enum CodingKeys: String, CodingKey {
        case date
        case isWorking  = "is_working"
        case startHour  = "start_hour"
        case endHour    = "end_hour"
        case note
    }
}

/// The rep's submitted 40-day calendar plan.
struct FortyDayPlan: Codable, Equatable {
    var days: [WorkDay]
    var submitted: Bool
}

/// Top-level onboarding progress record returned by the backend.
struct OnboardingProgress: Codable, Equatable {
    var startDate: String           // YYYY-MM-DD (= hire date)
    var sitsCompleted: Int
    var milestones: [String: MilestoneState]
    var fortyDayPlan: FortyDayPlan?

    enum CodingKeys: String, CodingKey {
        case startDate      = "start_date"
        case sitsCompleted  = "sits_completed"
        case milestones
        case fortyDayPlan   = "forty_day_plan"
    }
}

struct OnboardingProgressResponse: Codable {
    let progress: OnboardingProgress
}

// ── Daily Journal ──────────────────────────────────────────────────────
// Mirrors GET/POST /api/journal and /api/journal/:id (see db migration
// 008-journal-entries.sql). One entry per user per day.

struct JournalEntry: Codable, Identifiable, Hashable {
    let id: String
    let entryDate: String       // YYYY-MM-DD
    var title: String?
    var wins: String
    var challenges: String
    var tomorrowsFocus: String
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id, title, wins, challenges
        case entryDate      = "entry_date"
        case tomorrowsFocus = "tomorrows_focus"
        case createdAt      = "created_at"
        case updatedAt      = "updated_at"
    }
}

struct JournalListResponse: Codable {
    let entries: [JournalEntry]
}

struct JournalEntryResponse: Codable {
    let entry: JournalEntry
}
