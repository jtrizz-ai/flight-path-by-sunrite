import SwiftUI

// MARK: - Login gate

struct LoginView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        GeometryReader { geo in
            ZStack {
                Color.fpBG

                // Same cinematic background as HomeView
                Image("HomeScene")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()

                RadialGradient(
                    gradient: Gradient(stops: [
                        .init(color: .clear, location: 0.40),
                        .init(color: Color.fpBG.opacity(0.55), location: 1.0)
                    ]),
                    center: UnitPoint(x: 0.5, y: 0.38),
                    startRadius: 0,
                    endRadius: max(geo.size.width, geo.size.height) * 0.7
                )
                LinearGradient(
                    stops: [
                        .init(color: Color.fpBG.opacity(0.5), location: 0.0),
                        .init(color: .clear, location: 0.22),
                        .init(color: .clear, location: 0.55),
                        .init(color: Color.fpBG.opacity(0.88), location: 1.0)
                    ],
                    startPoint: .top, endPoint: .bottom
                )

                LaunchLights()

                VStack(spacing: 0) {
                    // Hero wordmark
                    VStack(spacing: 10) {
                        Text("PRIVATE PROGRAM")
                            .font(FPFont.mono(11))
                            .tracking(4.2)
                            .foregroundColor(.ink2)
                        Text("FLIGHT PATH")
                            .font(FPFont.display(64))
                            .foregroundColor(.ink)
                            .shadow(color: .black.opacity(0.9), radius: 22, x: 0, y: 6)
                    }
                    .padding(.top, 56)

                    Spacer()

                    // Sign-in section
                    VStack(spacing: 18) {
                        Text("TEAM ACCESS ONLY")
                            .font(FPFont.mono(10))
                            .tracking(3.0)
                            .foregroundColor(.ink3)

                        GoogleSignInButton {
                            Task { await app.signInWithGoogle() }
                        }
                        .disabled(app.isSigningIn)

                        if let err = app.signInError {
                            Text(err)
                                .font(FPFont.mono(10))
                                .tracking(1.2)
                                .foregroundColor(.fpAccent)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 16)
                        }
                    }
                    .padding(.bottom, 52)
                }
                .frame(maxWidth: .infinity)
                .padding(.horizontal, 32)

                GrainOverlay()
            }
            .frame(width: geo.size.width, height: geo.size.height)
            .clipped()
        }
        .ignoresSafeArea()
    }
}

// MARK: - Google sign-in button

private struct GoogleSignInButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                GoogleGLogo()
                Text("Continue with Google")
                    .font(FPFont.sans(15, .semibold))
                    .foregroundColor(.ink)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Color.white.opacity(0.06))
            .overlay(
                RoundedRectangle(cornerRadius: FPRadius.button)
                    .strokeBorder(Color.white.opacity(0.18), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: FPRadius.button))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Google G logo (four-color)

private struct GoogleGLogo: View {
    private let blue   = Color(red: 0.259, green: 0.522, blue: 0.957)
    private let red    = Color(red: 0.918, green: 0.263, blue: 0.208)
    private let yellow = Color(red: 0.984, green: 0.737, blue: 0.020)
    private let green  = Color(red: 0.204, green: 0.659, blue: 0.325)

    var body: some View {
        ZStack {
            Circle()
                .fill(Color.white)
                .frame(width: 22, height: 22)

            // Four-arc G drawn with canvas for crisp rendering
            Canvas { ctx, size in
                let cx = size.width / 2, cy = size.height / 2
                let r: CGFloat = 9, sw: CGFloat = 3.5

                // Blue — top left + right sweep (full top half)
                stroke(ctx, cx: cx, cy: cy, r: r, sw: sw,
                       start: 225, end: 45, color: blue)
                // Red — top left arc
                stroke(ctx, cx: cx, cy: cy, r: r, sw: sw,
                       start: 180, end: 225, color: red)
                // Yellow — bottom left
                stroke(ctx, cx: cx, cy: cy, r: r, sw: sw,
                       start: 135, end: 180, color: yellow)
                // Green — bottom right
                stroke(ctx, cx: cx, cy: cy, r: r, sw: sw,
                       start: 45, end: 135, color: green)

                // Horizontal bar of the G
                let barY = cy + 0.5
                let barX1 = cx + 1.5, barX2 = cx + r - 0.5
                var bar = Path()
                bar.move(to: CGPoint(x: barX1, y: barY))
                bar.addLine(to: CGPoint(x: barX2, y: barY))
                ctx.stroke(bar, with: .color(blue), style: StrokeStyle(lineWidth: sw - 1))
            }
            .frame(width: 22, height: 22)
        }
    }

    private func stroke(
        _ ctx: GraphicsContext,
        cx: CGFloat, cy: CGFloat, r: CGFloat, sw: CGFloat,
        start: CGFloat, end: CGFloat,
        color: Color
    ) {
        let s = start * .pi / 180
        let e = end   * .pi / 180
        var path = Path()
        path.addArc(center: CGPoint(x: cx, y: cy),
                    radius: r,
                    startAngle: .radians(s),
                    endAngle: .radians(e),
                    clockwise: false)
        ctx.stroke(path, with: .color(color), style: StrokeStyle(lineWidth: sw, lineCap: .round))
    }
}

#Preview {
    LoginView()
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
        .onAppear { FPFonts.registerAll() }
}
