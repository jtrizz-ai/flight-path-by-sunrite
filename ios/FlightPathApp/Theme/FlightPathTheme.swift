import SwiftUI

// MARK: - Flight Path Theme

struct FlightPathTheme {
    // MARK: - Colors

    /// Background colors for dark theme (default)
    struct Background {
        static let primary = Color(hex: "060607")
        static let secondary = Color(hex: "0C0C10")
    }

    /// Text colors
    struct Text {
        static let primary = Color.white
        static let secondary = Color.white.opacity(0.72)
        static let tertiary = Color.white.opacity(0.45)
    }

    /// Border colors
    struct Border {
        static let subtle = Color.white.opacity(0.16)
    }

    /// Accent colors (use sparingly)
    struct Accent {
        static let primary = Color(hex: "E8472A")
        static let secondary = Color(hex: "FF8A5B")
    }

    // MARK: - Spacing

    struct Spacing {
        static let s4: CGFloat = 4
        static let s8: CGFloat = 8
        static let s12: CGFloat = 12
        static let s16: CGFloat = 16
        static let s24: CGFloat = 24
        static let s32: CGFloat = 32
        static let s48: CGFloat = 48
        static let s64: CGFloat = 64
    }

    // MARK: - Radius

    struct Radius {
        static let small: CGFloat = 6
        static let medium: CGFloat = 10
        static let large: CGFloat = 14
        static let circle: CGFloat = 999
    }
}

// MARK: - Preview Helper

#if DEBUG
struct ThemePreview: View {
    var body: some View {
        VStack(spacing: FlightPathTheme.Spacing.s16) {
            Text("Background Primary")
                .padding()
                .background(FlightPathTheme.Background.primary)

            Text("Background Secondary")
                .padding()
                .background(FlightPathTheme.Background.secondary)

            Text("Accent Colors")
                .foregroundColor(FlightPathTheme.Accent.primary)

            Text("Text Hierarchy")
                .foregroundColor(FlightPathTheme.Text.primary)
        }
        .padding()
        .background(FlightPathTheme.Background.primary)
    }
}
#endif
