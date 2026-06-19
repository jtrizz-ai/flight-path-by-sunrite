import SwiftUI

struct SourceCitationCard: View {
    let source: ChatSource

    private let accent = Color(red: 232/255, green: 71/255, blue: 42/255)

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Image(systemName: "doc.text")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundColor(accent)
                Text("SOURCE")
                    .font(FPFont.mono(8))
                    .tracking(1.4)
                    .foregroundColor(accent)
            }
            Text(source.title)
                .font(FPFont.sans(12, .semibold))
                .foregroundColor(.ink)
                .lineLimit(1)
            Text(source.snippet)
                .font(FPFont.sans(10.5))
                .foregroundColor(.ink3)
                .lineLimit(3)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.white.opacity(0.03))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.line, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}
