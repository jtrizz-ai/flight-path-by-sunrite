import SwiftUI

// MARK: - Home / launch pad

struct HomeView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        GeometryReader { geo in
            ZStack {
                Color.fpBG

                // Cinematic background
                Image("HomeScene")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()

                // Scrim: radial vignette + top/bottom darkening
                RadialGradient(
                    gradient: Gradient(stops: [
                        .init(color: .clear, location: 0.40),
                        .init(color: Color.fpBG.opacity(0.5), location: 1.0)
                    ]),
                    center: UnitPoint(x: 0.5, y: 0.38),
                    startRadius: 0,
                    endRadius: max(geo.size.width, geo.size.height) * 0.7
                )
                LinearGradient(
                    stops: [
                        .init(color: Color.fpBG.opacity(0.45), location: 0.0),
                        .init(color: .clear, location: 0.24),
                        .init(color: .clear, location: 0.62),
                        .init(color: Color.fpBG.opacity(0.78), location: 1.0)
                    ],
                    startPoint: .top, endPoint: .bottom
                )

                // Animated approach lights
                LaunchLights()

                // Hero + welcome
                VStack {
                    VStack(spacing: 12) {
                        Text("CLEARED FOR DEPARTURE")
                            .font(FPFont.mono(11))
                            .tracking(4.2)
                            .foregroundColor(.ink2)
                        Text("FLIGHT PATH")
                            .font(FPFont.display(64))
                            .foregroundColor(.ink)
                            .shadow(color: .black.opacity(0.9), radius: 22, x: 0, y: 6)
                    }
                    .padding(.top, 42)

                    Spacer()

                    // Badge display
                    if !app.badges.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(app.badges) { badge in
                                    VStack(spacing: 2) {
                                        Text(badge.name)
                                            .font(FPFont.display(13))
                                            .tracking(0.02)
                                            .foregroundColor(.ink)
                                        if badge.isQuarterly, let q = badge.quarter, let y = badge.year {
                                            Text("Q\(q) · \(y)")
                                                .font(FPFont.mono(8))
                                                .tracking(0.15)
                                                .foregroundColor(.fpAccent2)
                                        }
                                    }
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 8)
                                    .background(
                                        RoundedRectangle(cornerRadius: 14)
                                            .fill(Color.fpAccent.opacity(0.08))
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 14)
                                                    .stroke(Color.fpAccent.opacity(0.3), lineWidth: 1)
                                            )
                                    )
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                    }

                    Text("Welcome back, \(app.displayUserName) — ready for departure")
                        .font(FPFont.mono(11))
                        .tracking(1.4)
                        .foregroundColor(.ink2)
                        .multilineTextAlignment(.center)
                        .padding(.bottom, 18)
                }
                .frame(maxWidth: .infinity)
                .padding(.horizontal, 20)

                GrainOverlay()
            }
            .frame(width: geo.size.width, height: geo.size.height)
            .clipped()
        }
    }
}
