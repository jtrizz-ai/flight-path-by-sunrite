import Foundation

// Backend base URL is user-editable in SettingsView and persisted in
// UserDefaults. Default points at localhost for the simulator hitting
// `npm run dev`. Tailscale/production URLs go in via the Settings UI.
enum AppConfig {
    private static let key = "fp_backend_url"
    private static let defaultURL = "http://localhost:3000"

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
