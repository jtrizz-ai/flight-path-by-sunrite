import SwiftUI
import GoogleSignIn

@main
struct FlightPathApp: App {
    @StateObject private var app = AppState()

    init() {
        FPFonts.registerAll()
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(
            clientID: "1007966664828-4a8106kf2b0c4ee0r61j53bot9vu4a8g.apps.googleusercontent.com"
        )
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.dark)
                .environmentObject(app)
                .task {
                    // Silently restore a cached Google session so returning users
                    // skip the login screen without re-tapping "Continue with Google".
                    await app.restorePreviousSignIn()
                }
                .onOpenURL { url in
                    // Hand the OAuth redirect back to GoogleSignIn to complete the flow.
                    GIDSignIn.sharedInstance.handle(url)
                }
        }
    }
}
