import SwiftUI

// MARK: - Slide-in navigation drawer

struct SideDrawer: View {
    @EnvironmentObject var app: AppState
    @State private var showProfile = false
    @State private var showSettings = false
    @State private var showDoorPitch = false

    private struct Link: Identifiable {
        let id = UUID()
        let title: String
        let systemImage: String?
        let useBrandMark: Bool
        let tab: AppTab?
    }

    private let navLinks: [Link] = [
        .init(title: "Home",     systemImage: "house",       useBrandMark: false, tab: .home),
        .init(title: "Schedule", systemImage: "calendar",    useBrandMark: false, tab: .schedule),
        .init(title: "Tally",    systemImage: "chart.bar",   useBrandMark: false, tab: .tally),
        .init(title: "Chat",     systemImage: "bubble.left", useBrandMark: false, tab: .chat)
    ]

    private var extraLinks: [Link] {
        var links: [Link] = []
        if app.user?.role == "Admin" {
            links.append(.init(title: "Admin Portal", systemImage: "shield.lefthalf.filled", useBrandMark: false, tab: nil))
        }
        links.append(.init(title: "Flight Path Program", systemImage: nil, useBrandMark: true, tab: nil))
        links.append(.init(title: "Door Pitch", systemImage: "mic", useBrandMark: false, tab: nil))
        links.append(.init(title: "Profile", systemImage: "person.crop.circle", useBrandMark: false, tab: nil))
        links.append(.init(title: "Settings", systemImage: "gearshape", useBrandMark: false, tab: nil))
        return links
    }

    var body: some View {
        ZStack(alignment: .trailing) {
            // Scrim — must cover the full screen so AppHeader/TabBar are blocked when open
            if app.drawerOpen {
                Color.black.opacity(0.5)
                    .ignoresSafeArea()
                    .transition(.opacity)
                    .onTapGesture { close() }
            }

            // Panel
            if app.drawerOpen {
                HStack(spacing: 0) {
                    Spacer(minLength: 0)
                    panel
                }
                .transition(.move(edge: .trailing))
            }
        }
        // Explicit full-screen frame so the scrim fills the whole shell.
        // Without this the ZStack collapses to the 300pt panel width and the
        // scrim does not cover the left portion of the screen.
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .animation(.spring(response: 0.34, dampingFraction: 0.86), value: app.drawerOpen)
        .allowsHitTesting(app.drawerOpen)
        .sheet(isPresented: $showDoorPitch) { DoorPitchView() }
        .sheet(isPresented: $showProfile) { ProfileView(app: app) }
        .sheet(isPresented: $showSettings) { SettingsView(app: app) }
    }

    private var panel: some View {
        VStack(alignment: .leading, spacing: 0) {
            // User block
            HStack(spacing: 12) {
                Text(app.userInitials)
                    .font(FPFont.display(18))
                    .foregroundColor(.white)
                    .frame(width: 46, height: 46)
                    .background(
                        LinearGradient(
                            colors: [.fpAccent, .fpAccent2],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(Circle())
                VStack(alignment: .leading, spacing: 3) {
                    Text(app.displayUserName)
                        .font(FPFont.sans(15, .bold))
                        .foregroundColor(.ink)
                    Text(app.displayUserEmail)
                        .font(FPFont.mono(10))
                        .foregroundColor(.ink3)
                }
                Spacer(minLength: 0)
            }
            .padding(.bottom, 20)
            .overlay(alignment: .bottom) {
                Rectangle().fill(Color.line).frame(height: 1)
            }
            .padding(.bottom, 14)

            VStack(alignment: .leading, spacing: 2) {
                ForEach(navLinks) { link in row(link) }

                Rectangle().fill(Color.line)
                    .frame(height: 1)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 12)

                ForEach(extraLinks) { link in row(link) }
            }

            Spacer()

            Text("SUNRITE SOLAR · FLIGHT PATH v1.0")
                .font(FPFont.mono(9.5))
                .tracking(1.3)
                .foregroundColor(.ink3)
                .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding(.horizontal, 22)
        .padding(.vertical, 24)
        .frame(width: 300, alignment: .leading)
        .frame(maxHeight: .infinity)
        .background(Color.fpBG2, ignoresSafeAreaEdges: .all)
        .overlay(alignment: .leading) {
            Rectangle().fill(Color.line).frame(width: 1).ignoresSafeArea()
        }
    }

    private func row(_ link: Link) -> some View {
        Button {
            switch link.title {
            case "Door Pitch":
                showDoorPitch = true
            case "Profile":
                showProfile = true
            case "Settings":
                showSettings = true
            case "Admin Portal":
                let url = URL(string: AppConfig.backendBaseURL + "/admin")!
                UIApplication.shared.open(url)
                close()
            default:
                if let tab = link.tab { app.select(tab) }
                close()
            }
        } label: {
            HStack(spacing: 13) {
                Group {
                    if link.useBrandMark {
                        BrandMarkView(size: 19, color: .ink3, lineWidth: 2)
                    } else if let name = link.systemImage {
                        Image(systemName: name)
                            .font(.system(size: 17, weight: .regular))
                            .foregroundColor(.ink3)
                            .frame(width: 19, height: 19)
                    }
                }
                Text(link.title)
                    .font(FPFont.sans(14, .semibold))
                    .foregroundColor(.ink2)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 13)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func close() {
        withAnimation(.spring(response: 0.34, dampingFraction: 0.86)) {
            app.drawerOpen = false
        }
    }
}
