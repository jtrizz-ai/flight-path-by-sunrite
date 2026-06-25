import Foundation

// Backend base URL is user-editable in SettingsView and persisted in
// UserDefaults. Default points at the production backend exposed via
// Tailscale Funnel (valid HTTPS, no port).
// Change this when the backend moves.
enum AppConfig {
    private static let key = "fp_backend_url"
    private static let defaultURL = "https://flightpath.tailbce7aa.ts.net"

    static var backendBaseURL: String {
        get {
            let v = UserDefaults.standard.string(forKey: key) ?? ""
            return v.isEmpty ? defaultURL : v
        }
        set {
            UserDefaults.standard.set(newValue, forKey: key)
        }
    }

    /// Trims trailing slashes so callers can concatenate paths safely.
    static var backendBaseURLNormalized: String {
        backendBaseURL.hasSuffix("/")
            ? String(backendBaseURL.dropLast())
            : backendBaseURL
    }
}
