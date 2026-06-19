import SwiftUI

// MARK: - Chat

struct ChatView: View {
    @EnvironmentObject var app: AppState
    @State private var draft = ""
    @FocusState private var inputFocused: Bool

    var body: some View {
        ZStack {
            Color.fpBG.ignoresSafeArea()

            VStack(spacing: 0) {
                // Messages
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(app.messages) { message in
                                ChatBubble(message: message)
                                    .id(message.id)
                            }
                            if app.isTyping {
                                TypingIndicator()
                                    .id("typing")
                            }
                        }
                        .padding(20)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .onChange(of: app.messages.count) { _, _ in
                        if let last = app.messages.last {
                            withAnimation(.easeOut(duration: 0.25)) {
                                proxy.scrollTo(last.id, anchor: .bottom)
                            }
                        }
                    }
                    .onChange(of: app.isTyping) { _, isTyping in
                        if isTyping {
                            withAnimation(.easeOut(duration: 0.25)) {
                                proxy.scrollTo("typing", anchor: .bottom)
                            }
                        }
                    }
                }

                // Composer
                HStack(spacing: 10) {
                    TextField("", text: $draft, prompt: Text("Message Flight Path AI...")
                        .foregroundColor(.ink3))
                        .font(FPFont.sans(14))
                        .foregroundColor(.ink)
                        .focused($inputFocused)
                        .submitLabel(.send)
                        .onSubmit(send)
                        .padding(.horizontal, 16)
                        .frame(height: 44)
                        .background(Color.white.opacity(0.04))
                        .overlay(
                            Capsule().stroke(Color.line, lineWidth: 1)
                        )
                        .clipShape(Capsule())

                    Button(action: send) {
                        Image(systemName: "paperplane.fill")
                            .font(.system(size: 17, weight: .medium))
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || app.isTyping ? Color.fpAccent.opacity(0.4) : Color.fpAccent)
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || app.isTyping)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(
                    Color.fpBG.opacity(0.6)
                        .background(.ultraThinMaterial)
                )
                .overlay(alignment: .top) {
                    Rectangle().fill(Color.line).frame(height: 1)
                }
            }
        }
    }

    private func send() {
        let text = draft
        draft = ""
        app.send(text)
    }
}

// MARK: - Chat bubble

private struct ChatBubble: View {
    let message: ChatMessage

    private var isMe: Bool { message.role == .me }

    var body: some View {
        HStack {
            if isMe { Spacer(minLength: 40) }

            VStack(alignment: .leading, spacing: 5) {
                Text(message.who.uppercased())
                    .font(FPFont.mono(9))
                    .tracking(1.6)
                    .foregroundColor(isMe ? Color.white.opacity(0.7) : .ink3)
                Text(message.text)
                    .font(FPFont.sans(13.5))
                    .foregroundColor(isMe ? .white : .ink)
                    .fixedSize(horizontal: false, vertical: true)
                if let sources = message.sources, !sources.isEmpty, !isMe {
                    VStack(spacing: 6) {
                        ForEach(sources) { src in
                            SourceCitationCard(source: src)
                        }
                    }
                    .padding(.top, 4)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .background(isMe ? Color.fpAccent : Color.card)
            .overlay(
                bubbleShape
                    .stroke(isMe ? Color.clear : Color.cardLine, lineWidth: 1)
            )
            .clipShape(bubbleShape)

            if !isMe { Spacer(minLength: 40) }
        }
    }

    // Rounded bubble with one tighter corner (mirrors the design's tail).
    private var bubbleShape: UnevenRoundedRectangle {
        let big: CGFloat = 16
        let small: CGFloat = 5
        return UnevenRoundedRectangle(
            topLeadingRadius: big,
            bottomLeadingRadius: isMe ? big : small,
            bottomTrailingRadius: isMe ? small : big,
            topTrailingRadius: big
        )
    }
}
