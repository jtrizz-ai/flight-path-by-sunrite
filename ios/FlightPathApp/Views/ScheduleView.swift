import SwiftUI

// MARK: - Schedule

struct ScheduleView: View {
    private let modules = ScheduleModule.all

    var body: some View {
        ZStack {
            ViewBackground(imageName: "ScheduleBG")

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    // Page title section
                    VStack(alignment: .leading, spacing: 4) {
                        Text("FLIGHT PATH PROGRAM")
                            .font(FPFont.mono(10))
                            .tracking(3.4)
                            .foregroundColor(.ink3)
                        Text("SCHEDULE")
                            .font(FPFont.display(38))
                            .foregroundColor(.ink)
                        Text("\(modules.count) modules")
                            .font(FPFont.mono(11))
                            .tracking(0.6)
                            .foregroundColor(.ink2)
                            .padding(.top, 4)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.bottom, 20)

                    VStack(spacing: 10) {
                        ForEach(modules) { module in
                            ScheduleRow(module: module)
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 22)
                .padding(.bottom, 30)
            }
        }
    }
}

private struct ScheduleRow: View {
    let module: ScheduleModule

    var body: some View {
        Button { } label: {
            HStack(spacing: 14) {
                Text(module.index)
                    .font(FPFont.mono(11, .bold))
                    .foregroundColor(.fpAccent2)
                    .frame(width: 24, alignment: .leading)

                VStack(alignment: .leading, spacing: 4) {
                    Text(module.title)
                        .font(FPFont.sans(14.5, .bold))
                        .foregroundColor(.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(module.subtitle.uppercased())
                        .font(FPFont.mono(10))
                        .tracking(1.2)
                        .foregroundColor(.ink3)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Image(systemName: "chevron.right")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.ink3)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 15)
            .cardSurface()
            // Match hit-test area to the visual rounded-rectangle card shape
            .contentShape(RoundedRectangle(cornerRadius: FPRadius.card))
        }
        .buttonStyle(.plain)
    }
}
