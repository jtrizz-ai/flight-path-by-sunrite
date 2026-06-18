import SwiftUI

// MARK: - Tally (field activity tracker)

struct TallyView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        ZStack {
            ViewBackground(imageName: "TallyBG")

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    ViewHeader(
                        eyebrow: "Field Tracker",
                        title: "Tally",
                        subtitle: "Today · tap to log your activity"
                    )

                    // Primary metric
                    BigTallyCard(
                        label: "Doors Knocked",
                        value: $app.doors,
                        goal: app.doorsGoal
                    )
                    .padding(.bottom, 14)

                    // Secondary metrics
                    HStack(spacing: 10) {
                        MiniTallyCard(label: "Conversations",
                                      value: $app.conversations,
                                      goal: app.conversationsGoal)
                        MiniTallyCard(label: "Appointments",
                                      value: $app.appointments,
                                      goal: app.appointmentsGoal)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 22)
                .padding(.bottom, 30)
            }
        }
    }
}

// MARK: - Big metric card

private struct BigTallyCard: View {
    let label: String
    @Binding var value: Int
    let goal: Int

    private var progress: CGFloat {
        guard goal > 0 else { return 0 }
        return min(1, CGFloat(value) / CGFloat(goal))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(label.uppercased())
                .font(FPFont.mono(10))
                .tracking(2.2)
                .foregroundColor(.ink3)

            HStack(alignment: .bottom, spacing: 10) {
                Text("\(value)")
                    .font(FPFont.display(72))
                    .foregroundColor(.ink)
                Text("/ \(goal) goal")
                    .font(FPFont.mono(12))
                    .foregroundColor(.ink2)
                    .padding(.bottom, 10)
            }
            .padding(.top, 6)
            .padding(.bottom, 14)

            ProgressBar(progress: progress)
                .padding(.bottom, 16)

            HStack(spacing: 10) {
                CounterButton(title: "−") { if value > 0 { value -= 1 } }
                CounterButton(title: "+ Knock", primary: true) { value += 1 }
            }
        }
        .padding(22)
        .cardSurface(radius: FPRadius.cardLg)
    }
}

// MARK: - Mini metric card

private struct MiniTallyCard: View {
    let label: String
    @Binding var value: Int
    let goal: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("\(value)")
                .font(FPFont.display(34))
                .foregroundColor(.ink)
            Text(label.uppercased())
                .font(FPFont.mono(9.5))
                .tracking(1.4)
                .foregroundColor(.ink3)
                .padding(.top, 4)

            HStack(spacing: 10) {
                CounterButton(title: "−") { if value > 0 { value -= 1 } }
                CounterButton(title: "+", primary: true) { value += 1 }
            }
            .padding(.top, 10)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .cardSurface(radius: FPRadius.tile)
    }
}

// MARK: - Progress bar

private struct ProgressBar: View {
    let progress: CGFloat

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.10))
                Capsule()
                    .fill(LinearGradient(
                        colors: [.fpAccent, .fpAccent2],
                        startPoint: .leading, endPoint: .trailing
                    ))
                    .frame(width: max(0, geo.size.width * progress))
            }
        }
        .frame(height: 6)
        .animation(.easeOut(duration: 0.4), value: progress)
    }
}
