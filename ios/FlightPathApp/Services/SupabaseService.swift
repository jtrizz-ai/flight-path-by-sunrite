import Foundation
import Supabase

// MARK: - Supabase Configuration
struct SupabaseConfig {
    let url: String
    let anonKey: String

    static let shared = SupabaseConfig(
        url: "YOUR_SUPABASE_URL_HERE",
        anonKey: "YOUR_SUPABASE_ANON_KEY_HERE"
    )
}

// MARK: - Supabase Service
class SupabaseService {
    static let shared = SupabaseService()
    private let client: SupabaseClient

    private init() {
        let config = SupabaseConfig.shared
        self.client = SupabaseClient(
            supabaseURL: config.url,
            supabaseKey: config.anonKey
        )
    }

    // MARK: - Authentication
    func signInWithGoogle() async throws -> Bool {
        // This would typically open a web browser for OAuth
        // For simplicity, we'll implement a basic version
        // In production, you'd use ASWebAuthenticationSession or similar

        return try await withCheckedThrowingContinuation { continuation in
            client.auth.signInWithOAuth(
                provider: GoogleAuthProvider(),
                options: nil,
                redirectTo: URL(string: "flightpath://auth/callback")
            ) { result in
                switch result {
                case .success(let session):
                    continuation.resume(returning: true)
                case .failure(let error):
                    continuation.resume(throwing: error)
                }
            }
        }
    }

    func getCurrentUser() async throws -> UserProfile {
        return try await withCheckedThrowingContinuation { continuation in
            client.auth.user { result in
                switch result {
                case .success(let user):
                    if let user = user {
                        let profile = UserProfile(
                            id: user.id,
                            email: user.email,
                            fullName: user.userMetadata["full_name"] as? String,
                            avatarURL: user.userMetadata["avatar_url"] as? String,
                            subscriptionTier: user.userMetadata["subscription_tier"] as? String ?? "free"
                        )
                        continuation.resume(returning: profile)
                    } else {
                        continuation.resume(throwing: APIError.noData)
                    }
                case .failure(let error):
                    continuation.resume(throwing: APIError.networkError(error))
                }
            }
        }
    }

    func signOut() async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Bool, Error>) in
            client.auth.signOut { result in
                switch result {
                case .success:
                    continuation.resume(returning: true)
                case .failure(let error):
                    continuation.resume(throwing: APIError.networkError(error))
                }
            }
        }
    }

    // MARK: - Session Management
    func getSession() async throws -> Bool {
        return try await withCheckedThrowingContinuation { continuation in
            client.auth.session { result in
                switch result {
                case .success(let session):
                    continuation.resume(returning: session != nil)
                case .failure:
                    continuation.resume(returning: false)
                }
            }
        }
    }
}

// MARK: - User Profile
struct UserProfile {
    let id: String
    let email: String?
    let fullName: String?
    let avatarURL: String?
    let subscriptionTier: String

    var isPremium: Bool {
        subscriptionTier == "premium" || subscriptionTier == "basic"
    }

    var canAccessHidden: Bool {
        subscriptionTier == "premium" || subscriptionTier == "basic"
    }
}
