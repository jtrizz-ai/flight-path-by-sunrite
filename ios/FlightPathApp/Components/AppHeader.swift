import SwiftUI

// MARK: - App header (brand + welcome + hamburger)

struct AppHeader: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        HStack(spacing: 12) {
            // Brand → Home (protected from compression)
            Button {
                app.select(.home)
            } label: {
                HStack(spacing: 9) {
                    BrandMarkView(size: 26)
                    VStack(alignment: .leading, spacing: 1) {
                        Text("SUNRITE SOLAR")
                            .font(FPFont.mono(12, .bold))
                            .tracking(1.0)
                            .foregroundColor(.ink)
                        Text("FLIGHT PATH")
                            .font(FPFont.mono(9.5, .medium))
                            .tracking(1.5)
                            .foregroundColor(.ink3)
                    }
                }
            }
            .buttonStyle(.plain)
            .layoutPriority(1)

            Spacer(minLength: 8)

            // Welcome + username (compresses first on narrow screens)
            VStack(alignment: .trailing, spacing: 1) {
                Text("Welcome")
                    .font(FPFont.mono(11))
                    .tracking(0.4)
                    .foregroundColor(.ink2)
                    .lineLimit(1)
                Text(app.userName)
                    .font(FPFont.mono(11, .bold))
                    .tracking(0.2)
                    .foregroundColor(.ink)
                    .lineLimit(1)
            }
            .layoutPriority(-1)

            // Hamburger (fixed size, never compresses)
            Button {
                withAnimation(.easeInOut(duration: 0.3)) { app.drawerOpen = true }
            } label: {
                Image(systemName: "line.3.horizontal")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.ink)
                    .frame(width: 40, height: 40)
                    .background(Color.white.opacity(0.03))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.line, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 18)
        .padding(.top, 8)
        .padding(.bottom, 12)
        // Two-argument form correctly extends background through the Dynamic Island / status bar.
        // Chaining .ignoresSafeArea() inside a .background() argument does NOT work reliably in a VStack.
        .background(Color.fpBG.opacity(0.6), ignoresSafeAreaEdges: .top)
        .background(.ultraThinMaterial, ignoresSafeAreaEdges: .top)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Color.line).frame(height: 1)
        }
    }
}
