import SwiftUI
import CoreText

// MARK: - Runtime font registration
//
// The .ttf files live in the app bundle (Resources/Fonts). Registering them at
// runtime via CoreText means we don't need to maintain a UIAppFonts array in
// Info.plist — call `FPFonts.registerAll()` once at launch.

enum FPFonts {
    private static var didRegister = false

    static let fileNames = [
        "Anton-Regular",
        "Archivo-Medium",
        "Archivo-SemiBold",
        "Archivo-Bold",
        "Archivo-Black",
        "JetBrainsMono-Regular",
        "JetBrainsMono-Medium",
        "JetBrainsMono-Bold"
    ]

    static func registerAll() {
        guard !didRegister else { return }
        didRegister = true
        for name in fileNames {
            guard let url = Bundle.main.url(forResource: name, withExtension: "ttf") else {
                #if DEBUG
                print("⚠️ Font file not found in bundle: \(name).ttf")
                #endif
                continue
            }
            var error: Unmanaged<CFError>?
            if !CTFontManagerRegisterFontsForURL(url as CFURL, .process, &error) {
                #if DEBUG
                if let err = error?.takeRetainedValue() {
                    print("⚠️ Font registration note for \(name): \(err)")
                }
                #endif
            }
        }
    }
}

// MARK: - Font helpers (PostScript names verified from the bundled .ttf files)

enum FPFont {
    enum MonoWeight { case regular, medium, bold }
    enum SansWeight { case medium, semibold, bold, black }

    /// Anton — display / hero wordmarks (single weight).
    static func display(_ size: CGFloat) -> Font {
        .custom("Anton-Regular", size: size)
    }

    /// JetBrains Mono — labels, eyebrows, metadata.
    static func mono(_ size: CGFloat, _ weight: MonoWeight = .regular) -> Font {
        switch weight {
        case .regular: return .custom("JetBrainsMono-Regular", size: size)
        case .medium:  return .custom("JetBrainsMono-Medium", size: size)
        case .bold:    return .custom("JetBrainsMono-Bold", size: size)
        }
    }

    /// Archivo — body / UI sans.
    static func sans(_ size: CGFloat, _ weight: SansWeight = .medium) -> Font {
        switch weight {
        case .medium:   return .custom("Archivo-Medium", size: size)
        case .semibold: return .custom("Archivo-SemiBold", size: size)
        case .bold:     return .custom("Archivo-Bold", size: size)
        case .black:    return .custom("Archivo-Black", size: size)
        }
    }
}
