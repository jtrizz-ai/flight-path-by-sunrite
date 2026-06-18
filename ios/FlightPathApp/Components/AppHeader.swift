import SwiftUI

// MARK: - App header (brand + welcome + hamburger)

struct AppHeader: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        HStack(spacing: 12) {
            // Brand → Home
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

            Spacer(minLength: 8)

            // Welcome + username
            VStack(alignment: .trailing, spacing: 1) {
                Text("Welcome")
                    .font(FPFont.mono(11))
                    .tracking(0.4)
                    .foregroundColor(.ink2)
                Text(app.userName)
                    .font(FPFont.mono(11, .bold))
                    .tracking(0.2)
                    .foregroundColor(.ink)
            }

            // Hamburger
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
        .background(
            Color.fpBG.opacity(0.6)
                .background(.ultraThinMaterial)
                .ignoresSafeArea(edges: .top)
        )
        .overlay(alignment: .bottom) {
            Rectangle().fill(Color.line).frame(height: 1)
        }
    }
}
