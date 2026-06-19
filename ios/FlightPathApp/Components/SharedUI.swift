import SwiftUI

// MARK: - View header (eyebrow · big display title · subtitle)

struct ViewHeader: View {
    let eyebrow: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(eyebrow.uppercased())
                .font(FPFont.mono(10))
                .tracking(3.4)
                .foregroundColor(.ink3)
                .padding(.bottom, 8)
            Text(title.uppercased())
                .font(FPFont.display(46))
                .foregroundColor(.ink)
            Text(subtitle)
                .font(FPFont.mono(11))
                .tracking(0.6)
                .foregroundColor(.ink2)
                .padding(.top, 8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, 18)
    }
}

// MARK: - Card surface modifier

struct CardSurface: ViewModifier {
    var radius: CGFloat = FPRadius.card
    func body(content: Content) -> some View {
        content
            .background(Color.card)
            .overlay(
                RoundedRectangle(cornerRadius: radius)
                    .stroke(Color.cardLine, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: radius))
    }
}

extension View {
    func cardSurface(radius: CGFloat = FPRadius.card) -> some View {
        modifier(CardSurface(radius: radius))
    }
}

// MARK: - Background image + scrim used by Schedule / Tally views

struct ViewBackground: View {
    let imageName: String

    var body: some View {
        ZStack {
            Color.fpBG
            Image(imageName)
                .resizable()
                .aspectRatio(contentMode: .fill)
            // .vbg-scrim gradient
            LinearGradient(
                stops: [
                    .init(color: Color.fpBG.opacity(0.80), location: 0.0),
                    .init(color: Color.fpBG.opacity(0.72), location: 0.38),
                    .init(color: Color.fpBG.opacity(0.88), location: 1.0)
                ],
                startPoint: .top, endPoint: .bottom
            )
        }
        // Explicit frame prevents the ZStack from over-expanding beyond the content slot.
        // Must come before .clipped() so the clip boundary matches the intended frame.
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipped()
    }
}

// MARK: - Tally-style counter button

struct CounterButton: View {
    let title: String
    var primary: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(FPFont.mono(13, .bold))
                .tracking(1.0)
                .foregroundColor(primary ? .white : .ink)
                .frame(maxWidth: .infinity)
                .frame(height: 46)
                .background(primary ? Color.fpAccent : Color.white.opacity(0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: FPRadius.button)
                        .stroke(primary ? Color.fpAccent : Color.line, lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: FPRadius.button))
        }
        .buttonStyle(.plain)
    }
}
