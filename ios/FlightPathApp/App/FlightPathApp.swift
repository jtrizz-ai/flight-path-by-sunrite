import SwiftUI

@main
struct FlightPathApp: App {
    init() {
        FPFonts.registerAll()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.dark)
        }
    }
}
