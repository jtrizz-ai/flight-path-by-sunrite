import SwiftUI

// MARK: - Root shell (header · active view · tab bar · drawer)

struct RootView: View {
    @StateObject private var app = AppState()

    var body: some View {
        ZStack {
            Color.fpBG.ignoresSafeArea()

            VStack(spacing: 0) {
                AppHeader()

                ZStack {
                    switch app.tab {
                    case .home:     HomeView()
                    case .schedule: ScheduleView()
                    case .tally:    TallyView()
                    case .chat:     ChatView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .clipped()

                TabBar()
            }

            // Slide-in drawer sits above everything
            SideDrawer()
        }
        .environmentObject(app)
    }
}

#Preview {
    RootView()
        .preferredColorScheme(.dark)
        .onAppear { FPFonts.registerAll() }
}
