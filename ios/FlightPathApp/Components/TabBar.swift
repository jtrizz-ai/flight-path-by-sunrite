import SwiftUI

// MARK: - Bottom tab bar (Schedule · Tally · Chat)

struct TabBar: View {
    @EnvironmentObject var app: AppState

    private struct Item {
        let tab: AppTab
        let label: String
        let systemImage: String
    }

    private let items: [Item] = [
        .init(tab: .schedule, label: "SCHEDULE", systemImage: "calendar"),
        .init(tab: .tally, label: "TALLY", systemImage: "chart.bar"),
        .init(tab: .chat, label: "CHAT", systemImage: "bubble.left")
    ]

    var body: some View {
        HStack(spacing: 0) {
            ForEach(items, id: \.tab) { item in
                let active = app.tab == item.tab
                Button {
                    app.select(item.tab)
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: item.systemImage)
                            .font(.system(size: 21, weight: .regular))
                        Text(item.label)
                            .font(FPFont.mono(9.5, .medium))
                            .tracking(1.3)
                    }
                    .foregroundColor(active ? .fpAccent2 : .ink3)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 10)
        .padding(.top, 8)
        .padding(.bottom, 6)
        .background(
            Color(hex: "08080A").opacity(0.92)
                .background(.ultraThinMaterial)
                .ignoresSafeArea(edges: .bottom)
        )
        .overlay(alignment: .top) {
            Rectangle().fill(Color.line).frame(height: 1)
        }
    }
}
