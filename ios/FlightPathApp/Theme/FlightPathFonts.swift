import SwiftUI

// MARK: - Flight Path Fonts

struct FlightPathFonts {
    /// Display font for wordmarks and hero text
    static func display(size: CGFloat = 34) -> Font {
        return Font.system(size: size)
            .weight(.black)
    }

    /// Body font for regular text
    static func body(size: CGFloat = 17) -> Font {
        return Font.system(size: size)
    }

    /// Monospaced font for labels and metadata
    static func mono(size: CGFloat = 12) -> Font {
        return Font.system(
            <#Font.TextStyle#>, design: .monospaced,
            weight: .regular
        ).monospacedDigit()
    }

    /// Heading font
    static func heading(size: CGFloat = 24) -> Font {
        return Font.system(size: size)
            .weight(.semibold)
    }
}

// MARK: - Font Extensions

extension Font {
    /// Quick access to display font
    static var fpDisplay: Font {
        return FlightPathFonts.display()
    }

    /// Quick access to mono font
    static var fpMono: Font {
        return FlightPathFonts.mono()
    }
}
