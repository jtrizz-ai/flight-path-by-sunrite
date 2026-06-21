import SwiftUI

// MARK: - Chat

struct ChatView: View {
    @EnvironmentObject var app: AppState
    @State private var draft = ""
    @FocusState private var inputFocused: Bool
    @State private var showHistory = false

    var body: some View {
        ZStack {
            Color.fpBG.ignoresSafeArea()

            VStack(spacing: 0) {
                chatTopBar

                ScrollViewReader { proxy in
                    ScrollView {
                        if app.messages.isEmpty && !app.isTyping {
                            chatEmptyState
                        } else {
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

                composerBar
            }
        }
        .sheet(isPresented: $showHistory) {
            ChatHistorySheet()
                .environmentObject(app)
        }
    }

    // MARK: - Top bar

    private var chatTopBar: some View {
        HStack {
            Text("NEW CHAT")
                .font(FPFont.mono(10, .bold))
                .tracking(1.5)
                .foregroundColor(.ink3)

            Spacer()

            Button {
                showHistory = true
            } label: {
                HStack(spacing: 5) {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 11, weight: .medium))
                    Text("HISTORY")
                        .font(FPFont.mono(9, .medium))
                        .tracking(1.2)
                }
                .foregroundColor(.ink3)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.white.opacity(0.04))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.line, lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 10)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Color.line).frame(height: 1)
        }
    }

    // MARK: - Empty state

    private var chatEmptyState: some View {
        VStack(spacing: 22) {
            Spacer(minLength: 40)

            ZStack {
                Circle()
                    .fill(Color.fpAccent.opacity(0.12))
                    .frame(width: 76, height: 76)
                Circle()
                    .fill(Color.fpAccent.opacity(0.06))
                    .frame(width: 96, height: 96)
                Image(systemName: "airplane")
                    .font(.system(size: 32, weight: .medium))
                    .foregroundColor(.fpAccent2)
            }

            VStack(spacing: 7) {
                Text("FLIGHT PATH AI")
                    .font(FPFont.mono(12, .bold))
                    .tracking(2.0)
                    .foregroundColor(.ink2)
                Text("Ask anything about solar sales,\nscripts, or your training.")
                    .font(FPFont.sans(13.5))
                    .foregroundColor(.ink3)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
            }

            VStack(spacing: 8) {
                suggestionChip("Explain the door pitch")
                suggestionChip("What should I focus on today?")
                suggestionChip("Give me objection-handling tips")
            }

            Spacer(minLength: 20)
        }
        .padding(.horizontal, 30)
        .frame(maxWidth: .infinity)
    }

    private func suggestionChip(_ text: String) -> some View {
        Button {
            draft = text
            send()
        } label: {
            Text(text)
                .font(FPFont.sans(13))
                .foregroundColor(.ink2)
                .padding(.horizontal, 16)
                .padding(.vertical, 9)
                .background(Color.white.opacity(0.04))
                .overlay(Capsule().stroke(Color.line, lineWidth: 1))
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    // MARK: - Composer

    private var composerBar: some View {
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
                .overlay(Capsule().stroke(Color.line, lineWidth: 1))
                .clipShape(Capsule())

            Button(action: send) {
                Image(systemName: "paperplane.fill")
                    .font(.system(size: 17, weight: .medium))
                    .foregroundColor(.white)
                    .frame(width: 44, height: 44)
                    .background(
                        draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || app.isTyping
                            ? Color.fpAccent.opacity(0.4)
                            : Color.fpAccent
                    )
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

    private func send() {
        let text = draft
        draft = ""
        app.send(text)
    }
}

// MARK: - Chat bubble

fileprivate struct ChatBubble: View {
    let message: ChatMessage
    @State private var copied = false

    private var isMe: Bool { message.role == .me }

    var body: some View {
        VStack(alignment: isMe ? .trailing : .leading, spacing: 4) {
            HStack {
                if isMe { Spacer(minLength: 40) }

                VStack(alignment: .leading, spacing: 5) {
                    Text(message.who.uppercased())
                        .font(FPFont.mono(9))
                        .tracking(1.6)
                        .foregroundColor(isMe ? Color.white.opacity(0.7) : .ink3)
                    if isMe {
                        Text(message.text)
                            .font(FPFont.sans(13.5))
                            .foregroundColor(.white)
                            .fixedSize(horizontal: false, vertical: true)
                    } else {
                        MarkdownText(message.text, baseFont: FPFont.sans(13.5))
                            .fixedSize(horizontal: false, vertical: true)
                    }
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

            // Copy button
            HStack {
                if isMe { Spacer() }

                Button {
                    UIPasteboard.general.string = message.text
                    withAnimation(.spring(response: 0.25, dampingFraction: 0.7)) {
                        copied = true
                    }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                        withAnimation(.easeOut(duration: 0.2)) {
                            copied = false
                        }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: copied ? "checkmark" : "doc.on.doc")
                            .font(.system(size: 10, weight: .medium))
                        if copied {
                            Text("Copied")
                                .font(FPFont.mono(9))
                                .transition(.opacity.combined(with: .scale(scale: 0.85)))
                        }
                    }
                    .foregroundColor(copied ? .fpSuccess : .ink3)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.white.opacity(copied ? 0.06 : 0.03))
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(copied ? Color.fpSuccess.opacity(0.4) : Color.line, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                }
                .buttonStyle(.plain)
                .animation(.spring(response: 0.25, dampingFraction: 0.7), value: copied)

                if !isMe { Spacer() }
            }
            .padding(.horizontal, 4)
        }
    }

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

// MARK: - Chat history sheet

struct ChatHistorySheet: View {
    @EnvironmentObject var app: AppState
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color.fpBG.ignoresSafeArea()

                if app.chatHistory.isEmpty {
                    VStack(spacing: 14) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: 38, weight: .light))
                            .foregroundColor(.ink3)
                        Text("No history yet")
                            .font(FPFont.sans(15))
                            .foregroundColor(.ink3)
                        Text("Your previous conversations will appear here.")
                            .font(FPFont.sans(12))
                            .foregroundColor(.ink3.opacity(0.7))
                            .multilineTextAlignment(.center)
                    }
                    .padding(40)
                } else {
                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(app.chatHistory) { message in
                                ChatBubble(message: message)
                            }
                        }
                        .padding(20)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
            .navigationTitle("Chat History")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.fpBG, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundColor(.fpAccent2)
                        .font(FPFont.sans(14))
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}
