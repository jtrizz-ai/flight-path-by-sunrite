import Foundation

// Backend base URL is user-editable in SettingsView and persisted in
// UserDefaults. Default points at the dev backend running on this Mac
// (Jonathan's Mac Studio, Tailscale IP 100.101.18.67) over Tailscale.
// Change this when the backend moves (e.g. to the trashcan in production).
enum AppConfig {
    private static let key = "fp_backend_url"
    private static let defaultURL = "http://100.117.75.7:3101"

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
