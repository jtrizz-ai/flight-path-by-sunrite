import SwiftUI

// MARK: - Color tokens (mirrors the design system :root variables)

extension Color {
    /// --bg #060607
    static let fpBG       = Color(hex: "060607")
    /// --bg-2 #0c0c10
    static let fpBG2      = Color(hex: "0C0C10")
    /// --accent #E8472A
    static let fpAccent   = Color(hex: "E8472A")
    /// --accent-2 #FF8A5B
    static let fpAccent2  = Color(hex: "FF8A5B")
    /// --ink #FFFFFF
    static let ink        = Color.white
    /// --ink-2 rgba(255,255,255,.72)
    static let ink2       = Color.white.opacity(0.72)
    /// --ink-3 rgba(255,255,255,.45)
    static let ink3       = Color.white.opacity(0.45)
    /// --line rgba(255,255,255,.14)
    static let line       = Color.white.opacity(0.14)
    /// --card rgba(255,255,255,.045)
    static let card       = Color.white.opacity(0.045)
    /// --card-line rgba(255,255,255,.10)
    static let cardLine   = Color.white.opacity(0.10)
    /// runway / launch light glow color
    static let runwayLight = Color(hex: "FFCB9C")
    /// --success #36C26E
    static let fpSuccess    = Color(hex: "36C26E")
    /// --success-dim white 25% (incomplete dot fill)
    static let fpSuccessDim = Color.white.opacity(0.25)
}

// MARK: - Radius tokens

enum FPRadius {
    /// --r 18px
    static let card: CGFloat = 18
    static let cardLg: CGFloat = 22
    static let pill: CGFloat = 999
    static let button: CGFloat = 14
    static let tile: CGFloat = 16
    static let md: CGFloat = 16
}
