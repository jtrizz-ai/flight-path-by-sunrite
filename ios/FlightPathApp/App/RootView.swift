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
