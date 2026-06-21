import SwiftUI

// MARK: - Root shell (header · active view · tab bar · drawer)

struct RootView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        Group {
            if app.isAuthenticated {
                mainShell
            } else {
                LoginView()
            }
        }
    }

    private var mainShell: some View {
        ZStack {
            Color.fpBG.ignoresSafeArea()

            VStack(spacing: 0) {
                AppHeader()

                // GeometryReader pins every tab view to the exact available
                // pixel rect — the same technique HomeView uses internally.
                // Without it, flexible layouts on non-Home tabs expand wider
                // than the screen on certain devices.
                GeometryReader { geo in
                    ZStack {
                        switch app.tab {
                        case .home:     HomeView()
                        case .schedule: ScheduleView()
                        case .tally:    TallyView()
                        case .chat:     ChatView()
                        }
                    }
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()
                }

                TabBar()
            }

            SideDrawer()
        }
    }
}

#Preview {
    RootView()
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
        .onAppear { FPFonts.registerAll() }
}
