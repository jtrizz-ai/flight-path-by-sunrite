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

                    WeeklyChart(todayDoors: app.doors, goal: app.doorsGoal)
                        .padding(.bottom, 14)

                    BigTallyCard(
                        label: "Doors Knocked",
                        value: $app.doors,
                        goal: app.doorsGoal
                    )
                    .padding(.bottom, 14)

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

// MARK: - Weekly bar chart

private struct WeeklyChart: View {
    let todayDoors: Int
    let goal: Int

    private struct DayBar: Identifiable {
        let id: Int
        let label: String
        let value: Int
        let isToday: Bool
        let isPast: Bool
    }

    private var todayColumnIndex: Int {
        // Calendar weekday: 1=Sun 2=Mon 3=Tue 4=Wed 5=Thu 6=Fri 7=Sat
        // Display order: Mon Tue Wed Thu Fri Sat Sun → indices 0–6
        switch Calendar.current.component(.weekday, from: Date()) {
        case 2: return 0
        case 3: return 1
        case 4: return 2
        case 5: return 3
        case 6: return 4
        case 7: return 5
        default: return 6  // Sunday
        }
    }

    private var bars: [DayBar] {
        let todayIdx = todayColumnIndex
        let labels  = ["M", "T", "W", "T", "F", "S", "S"]
        let samples = [32,  28,  40,  35,  17,   8,   0]
        return labels.enumerated().map { i, label in
            let isToday = i == todayIdx
            let isPast  = i < todayIdx
            return DayBar(
                id: i,
                label: label,
                value: isToday ? todayDoors : (isPast ? samples[i] : 0),
                isToday: isToday,
                isPast: isPast
            )
        }
    }

    var body: some View {
        let maxVal = max(goal, bars.map(\.value).max() ?? 1)

        VStack(alignment: .leading, spacing: 14) {
            // Header
            HStack {
                Text("THIS WEEK · DOORS KNOCKED")
                    .font(FPFont.mono(10))
                    .tracking(2.2)
                    .foregroundColor(.ink3)
                Spacer()
                Text("/ \(goal) GOAL")
                    .font(FPFont.mono(10))
                    .tracking(1.4)
                    .foregroundColor(.fpAccent2.opacity(0.7))
            }

            // Bar chart — equal-width bars, no GeometryReader needed
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(bars) { bar in
                    let h: CGFloat = bar.value > 0
                        ? max(5, CGFloat(bar.value) / CGFloat(maxVal) * 80)
                        : 3
                    VStack(spacing: 5) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(barFill(bar))
                            .frame(maxWidth: .infinity)
                            .frame(height: h)
                        Text(bar.label)
                            .font(FPFont.mono(9.5))
                            .tracking(0.6)
                            .foregroundColor(bar.isToday ? .fpAccent2 : .ink3)
                    }
                    .frame(maxWidth: .infinity)
                    .animation(.easeOut(duration: 0.4), value: bar.value)
                }
            }
            .frame(height: 106)

            // Legend
            HStack(spacing: 14) {
                legendItem(color: .fpAccent, label: "TODAY")
                legendItem(color: .white.opacity(0.22), label: "PAST DAYS")
                Spacer()
            }
        }
        .padding(18)
        .cardSurface(radius: FPRadius.cardLg)
    }

    private func barFill(_ bar: DayBar) -> AnyShapeStyle {
        if bar.isToday {
            return AnyShapeStyle(LinearGradient(
                colors: [.fpAccent, .fpAccent2],
                startPoint: .bottom,
                endPoint: .top
            ))
        } else if bar.isPast {
            return AnyShapeStyle(Color.white.opacity(0.22))
        } else {
            return AnyShapeStyle(Color.white.opacity(0.07))
        }
    }

    private func legendItem(color: Color, label: String) -> some View {
        HStack(spacing: 5) {
            Circle().fill(color).frame(width: 6, height: 6)
            Text(label)
                .font(FPFont.mono(9))
                .tracking(1.2)
                .foregroundColor(.ink3)
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
                // minimumScaleFactor prevents overflow when the count reaches 3+ digits
                // on narrow devices (320pt). lineLimit(1) keeps the number on one line.
                Text("\(value)")
                    .font(FPFont.display(72))
                    .foregroundColor(.ink)
                    .minimumScaleFactor(0.5)
                    .lineLimit(1)
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
