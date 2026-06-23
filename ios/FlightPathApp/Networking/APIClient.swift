import Foundation

enum APIError: LocalizedError {
    case notAuthenticated
    case http(Int, String?)
    case decoding(Error)
    case network(Error)
    case invalidURL

    var errorDescription: String? {
        switch self {
        case .notAuthenticated: return "Not signed in."
        case .http(let code, let msg): return "Server error \(code): \(msg ?? "")"
        case .decoding(let e): return "Could not parse response: \(e.localizedDescription)"
        case .network(let e): return "Network error: \(e.localizedDescription)"
        case .invalidURL: return "Bad URL. Check the backend URL in Settings."
        }
    }
}

// Typed request bodies (avoids dictionary-as-Encodable hacks).
private struct ExchangeRequest: Encodable { let googleIdToken: String }
private struct ChatRequestBody: Encodable {
    let message: String
    // Omit threadId when starting a new conversation so the backend creates one.
    let threadId: String?
}
private struct TallyRequestBody: Encodable { let metric: String; let amount: Int }
private struct PageViewBody: Encodable { let path: String; let title: String? }
private struct MilestoneCheckBody: Encodable {
    let milestoneId: String
    let selfChecked: Bool
    enum CodingKeys: String, CodingKey {
        case milestoneId = "milestone_id"
        case selfChecked = "self_checked"
    }
}
private struct FortyDayPlanBody: Encodable { let plan: FortyDayPlan }

@MainActor
final class APIClient {
    static let shared = APIClient()
    private init() {}

    /// Generic JSON request with optional auth + body. Decodes the response.
    private func request<T: Decodable>(
        path: String,
        method: String = "GET",
        body: Encodable? = nil,
        authRequired: Bool = true,
        tokenOverride: String? = nil
    ) async throws -> T {
        guard let url = URL(string: AppConfig.backendBaseURLNormalized + path) else {
            throw APIError.invalidURL
        }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let token = tokenOverride ?? KeychainStore.loadToken()
        if authRequired {
            guard let token else { throw APIError.notAuthenticated }
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        } else if let tokenOverride {
            req.setValue("Bearer \(tokenOverride)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            req.httpBody = try JSONEncoder().encode(AnyEncodable(body))
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch {
            throw APIError.network(error)
        }

        if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
            let apiErr = try? JSONDecoder().decode(ApiError.self, from: data)
            throw APIError.http(http.statusCode, apiErr?.error)
        }

        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw APIError.decoding(error)
        }
    }

    // ── Endpoints (thin wrappers) ─────────────────────────────────────────

    func exchangeToken(googleIdToken: String) async throws -> ExchangeResponse {
        try await request(
            path: "/api/auth/exchange",
            method: "POST",
            body: ExchangeRequest(googleIdToken: googleIdToken),
            authRequired: false
        )
    }

    func signOut() async {
        struct Empty: Decodable {}
        _ = try? await request(path: "/api/auth/signout", method: "POST") as Empty
        KeychainStore.clear()
    }

    func fetchMe() async throws -> UserProfile {
        let resp: MeResponse = try await request(path: "/api/me")
        return resp.user
    }

    func updateProfile(_ patch: UserProfilePatch) async throws -> UserProfile {
        let resp: MeResponse = try await request(
            path: "/api/profile",
            method: "PATCH",
            body: AnyEncodable(patch)
        )
        return resp.user
    }

    func fetchChatThreads() async throws -> [ChatThreadSummary] {
        let resp: ChatThreadListResponse = try await request(path: "/api/chat/threads")
        return resp.threads
    }

    func fetchChatThread(id: String) async throws -> ChatThread {
        let resp: ThreadResponse = try await request(path: "/api/chat/threads/\(id)")
        return resp.thread
    }

    func deleteChatThread(id: String) async throws {
        struct Empty: Decodable {}
        _ = try await request(
            path: "/api/chat/threads/\(id)",
            method: "DELETE"
        ) as Empty
    }

    func sendChat(message: String, threadId: String?) async throws -> ChatResponse {
        try await request(
            path: "/api/chat",
            method: "POST",
            body: ChatRequestBody(message: message, threadId: threadId)
        )
    }

    func health() async throws -> HealthResponse {
        try await request(path: "/api/chat/health")
    }

    // ── Avatar upload (multipart/form-data) ─────────────────────────────

    /// Upload a profile image. Returns the new avatar URL.
    func uploadAvatar(data: Data, mimeType: String) async throws -> String {
        guard let url = URL(string: AppConfig.backendBaseURLNormalized + "/api/profile/avatar") else {
            throw APIError.invalidURL
        }

        let boundary = "Boundary-\(UUID().uuidString)"
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        guard let token = KeychainStore.loadToken() else { throw APIError.notAuthenticated }
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let ext = (mimeType as NSString).pathExtension.isEmpty ? "img" : (mimeType as NSString).pathExtension
        let filename = "avatar.\(ext)"
        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        req.httpBody = body

        let (responseData, response): (Data, URLResponse)
        do {
            (responseData, response) = try await URLSession.shared.data(for: req)
        } catch {
            throw APIError.network(error)
        }

        if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
            let apiErr = try? JSONDecoder().decode(ApiError.self, from: responseData)
            throw APIError.http(http.statusCode, apiErr?.error)
        }

        struct AvatarResponse: Decodable { let avatarUrl: String? }
        let parsed = try JSONDecoder().decode(AvatarResponse.self, from: responseData)
        return parsed.avatarUrl ?? ""
    }

    // ── Tally ──────────────────────────────────────────────────────────

    func fetchTally() async throws -> TallyTotals {
        let resp: TallyResponse = try await request(path: "/api/tally")
        return resp.totals
    }

    func incrementTally(metric: String, amount: Int) async throws -> TallyTotals {
        let resp: TallyResponse = try await request(
            path: "/api/tally",
            method: "POST",
            body: TallyRequestBody(metric: metric, amount: amount)
        )
        return resp.totals
    }

    // ── Badges ─────────────────────────────────────────────────────────

    func fetchBadges() async throws -> [EarnedBadge] {
        let resp: BadgesResponse = try await request(path: "/api/me/badges")
        return resp.badges
    }

    // ── Onboarding / Schedule ──────────────────────────────────────────

    func fetchOnboardingProgress() async throws -> OnboardingProgress {
        let resp: OnboardingProgressResponse = try await request(path: "/api/schedule/progress")
        return resp.progress
    }

    func updateMilestone(id: String, selfChecked: Bool) async throws -> OnboardingProgress {
        let resp: OnboardingProgressResponse = try await request(
            path: "/api/schedule/milestone",
            method: "POST",
            body: MilestoneCheckBody(milestoneId: id, selfChecked: selfChecked)
        )
        return resp.progress
    }

    func updateFortyDayPlan(_ plan: FortyDayPlan) async throws -> OnboardingProgress {
        let resp: OnboardingProgressResponse = try await request(
            path: "/api/schedule/plan",
            method: "POST",
            body: FortyDayPlanBody(plan: plan)
        )
        return resp.progress
    }

    // ── Activity tracking ──────────────────────────────────────────────

    func trackAppOpen() {
        struct Empty: Decodable {}
        Task { _ = try? await request(path: "/api/track/app-open", method: "POST") as Empty }
    }

    func trackPageView(path: String, title: String? = nil) {
        struct Empty: Decodable {}
        Task {
            _ = try? await request(
                path: "/api/track/page-view",
                method: "POST",
                body: PageViewBody(path: path, title: title)
            ) as Empty
        }
    }
}

/// Type-erased Encodable wrapper so we can pass any encodable body to the
/// generic `request` helper.
private struct AnyEncodable: Encodable {
    private let encode: (Encoder) throws -> Void
    init(_ wrapped: Encodable) { self.encode = wrapped.encode }
    func encode(to encoder: Encoder) throws { try encode(encoder) }
}
