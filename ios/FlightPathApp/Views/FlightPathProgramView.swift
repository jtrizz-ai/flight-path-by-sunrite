import SwiftUI

// MARK: - Flight Path Program overview
//
// A native in-app landing page that explains what the Flight Path Program is,
// introduces its four pillars (Schedule, Tally, Door Pitch, Levels), and links
// the user deeper into each one. Tapping a pillar navigates within the app —
// no external browser.

struct FlightPathProgramView: View {
    @ObservedObject var app: AppState
    @Environment(\.dismiss) private var dismiss

    // Nested sheets for Door Pitch + Levels so they open from within this view
    // (avoids the dismiss-then-present race that happens when driving all
    // sheets from the parent SideDrawer).
    @State private var showDoorPitch = false
    @State private var showLevels = false

    fileprivate struct Pillar: Identifiable {
        let id = UUID()
        let index: String
        let title: String
        let description: String
        let systemImage: String
        let action: PillarAction
    }

    fileprivate enum PillarAction {
        case tab(AppTab)
        case doorPitch
        case levels
    }

    private var pillars: [Pillar] {
        [
            .init(index: "01", title: "Schedule",
                  description: "Your onboarding roadmap and 40-day work plan. Track milestones from your first knock through your first closed appointment.",
                  systemImage: "calendar",
                  action: .tab(.schedule)),
            .init(index: "02", title: "Tally",
                  description: "Count every door knocked, every conversation had, and every appointment set. Your daily numbers feed your milestones and badges.",
                  systemImage: "chart.bar.fill",
                  action: .tab(.tally)),
            .init(index: "03", title: "Door Pitch",
                  description: "The field script and tonality system — the intro, the offer, objection handling, and the appointment funnel that turns a knock into a sit.",
                  systemImage: "mic.fill",
                  action: .doorPitch),
            .init(index: "04", title: "Levels",
                  description: "Three earned tiers — High Flyer, Altitude Club, Stratosphere Club. Your rank is set by closed contracts from your leads.",
                  systemImage: "rosette",
                  action: .levels),
        ]
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.fpBG.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        heroSection
                        introSection
                        pillarsSection
                        breakdownSection
                        footerSection
                    }
                    .padding(.bottom, 50)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("FLIGHT PATH PROGRAM")
                        .font(FPFont.mono(11, .bold))
                        .tracking(2.0)
                        .foregroundColor(.ink)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(FPFont.mono(11, .bold))
                        .foregroundColor(.fpAccent2)
                }
            }
            .sheet(isPresented: $showDoorPitch) { DoorPitchView() }
            .sheet(isPresented: $showLevels) { LevelsView() }
        }
    }

    // MARK: - Hero

    private var heroSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("SUNRITE SOLAR")
                .font(FPFont.mono(10))
                .tracking(3.4)
                .foregroundColor(.fpAccent2)
            Text("FLIGHT PATH\nPROGRAM")
                .font(FPFont.display(48))
                .foregroundColor(.ink)
                .padding(.top, 4)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 28)
    }

    // MARK: - Intro

    private var introSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("The Flight Path Program is SunRite Solar's field sales development system. It takes a new Field Marketer from their first door knock to a full pipeline of closed contracts — with a guided schedule, real-time tally tracking, a proven door pitch, and an earned tier system that rewards the quality leads you put into the pipeline.")
                .font(FPFont.sans(16))
                .foregroundColor(.ink2)
                .lineSpacing(5)
                .fixedSize(horizontal: false, vertical: true)
            Text("Everything below is a part of your flight path. Tap any pillar to jump straight into it.")
                .font(FPFont.sans(16))
                .foregroundColor(.ink2)
                .lineSpacing(5)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 32)
    }

    // MARK: - Pillars

    private var pillarsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(pillars) { pillar in
                Button {
                    handlePillar(pillar.action)
                } label: {
                    PillarCard(pillar: pillar)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 40)
    }

    // MARK: - Breakdown

    private var breakdownSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("THE BREAKDOWN")
                .font(FPFont.mono(11))
                .tracking(3.0)
                .foregroundColor(.fpAccent2)
                .padding(.bottom, 16)

            BreakdownRow(label: "Onboarding",
                         text: "Start with the Schedule — a guided set of milestones from Week 1 through your first appointments.",
                         linkText: "Schedule", action: .tab(.schedule))
            BreakdownRow(label: "Daily Activity",
                         text: "Every door you knock, conversation you start, and appointment you set gets counted in the Tally.",
                         linkText: "Tally", action: .tab(.tally))
            BreakdownRow(label: "The Pitch",
                         text: "Learn the field script — the intro, the offer, objection handling, and the appointment funnel.",
                         linkText: "Door Pitch", action: .doorPitch)
            BreakdownRow(label: "The Tiers",
                         text: "Closed contracts from your leads earn you rank: High Flyer, Altitude Club, and Stratosphere Club.",
                         linkText: "Levels", action: .levels)
        }
        .padding(.horizontal, 20)
    }

    private var footerSection: some View {
        HStack {
            Text("SUNRITE SOLAR — FLIGHT PATH")
            Spacer()
            Text("CLEARED FOR DEPARTURE")
        }
        .font(FPFont.mono(9.5))
        .tracking(1.2)
        .foregroundColor(.ink3)
        .padding(.horizontal, 20)
        .padding(.top, 40)
        .overlay(alignment: .top) {
            Rectangle().fill(Color.line).frame(height: 1)
        }
    }

    // MARK: - Navigation

    private func handlePillar(_ action: PillarAction) {
        switch action {
        case .tab(let tab):
            dismiss()
            // Allow the sheet dismiss animation to begin before switching tabs.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                app.select(tab)
            }
        case .doorPitch:
            showDoorPitch = true
        case .levels:
            showLevels = true
        }
    }
}

// MARK: - Pillar card

private struct PillarCard: View {
    let pillar: FlightPathProgramView.Pillar

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            // Icon circle
            ZStack {
                Circle()
                    .fill(Color.fpAccent.opacity(0.10))
                    .overlay(Circle().stroke(Color.fpAccent.opacity(0.28), lineWidth: 1))
                Image(systemName: pillar.systemImage)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.fpAccent)
            }
            .frame(width: 44, height: 44)

            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    Text(pillar.index)
                        .font(FPFont.mono(10, .bold))
                        .tracking(1.4)
                        .foregroundColor(.fpAccent2)
                    Text(pillar.title.uppercased())
                        .font(FPFont.display(24))
                        .foregroundColor(.ink)
                }
                Text(pillar.description)
                    .font(FPFont.sans(14))
                    .foregroundColor(.ink2)
                    .lineSpacing(4)
                    .fixedSize(horizontal: false, vertical: true)

                // CTA — orange
                HStack(spacing: 4) {
                    Text("OPEN")
                        .font(FPFont.mono(10, .bold))
                        .tracking(1.0)
                        .foregroundColor(.fpAccent)
                    Image(systemName: "arrow.right")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.fpAccent)
                }
                .padding(.top, 4)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(16)
        .cardSurface()
    }
}

// MARK: - Breakdown row

private struct BreakdownRow: View {
    let label: String
    let text: String
    let linkText: String
    let action: FlightPathProgramView.PillarAction

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label.uppercased())
                .font(FPFont.mono(10))
                .tracking(1.4)
                .foregroundColor(.ink3)
            (
                Text(text)
                    .font(FPFont.sans(14))
                    .foregroundColor(.ink2)
                + Text(" ")
                + Text(linkText)
                    .font(FPFont.sans(14, .bold))
                    .foregroundColor(.fpAccent)
            )
            .lineSpacing(4)
            .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 12)
        .overlay(alignment: .top) {
            Rectangle().fill(Color.line).frame(height: 1)
        }
    }
}
