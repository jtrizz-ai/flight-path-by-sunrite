import SwiftUI

struct ChatView: View {
    @ObservedObject var viewModel: ModuleViewModel
    @State private var messageText = ""
    @State private var isTyping = false
    @FocusState private var isInputFocused: Bool

    var body: some View {
        FlightPathBackground {
            VStack(spacing: 0) {
                // Header
                VStack(spacing: FlightPathTheme.Spacing.s8) {
                    HeroWordmark("FLIGHT PATH ASSISTANT")
                    MonoLabel(text: "Ask questions about your program")
                }
                .padding(FlightPathTheme.Spacing.s16)
                .background(FlightPathTheme.Background.secondary.opacity(0.5))

                // Messages
                ScrollView {
                    VStack(spacing: FlightPathTheme.Spacing.s16) {
                        ForEach(viewModel.chatMessages) { message in
                            ChatBubble(message: message)
                                .id(message.id)
                        }

                        if isTyping {
                            HStack {
                                FlightPathCard {
                                    HStack(spacing: FlightPathTheme.Spacing.s8) {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: FlightPathTheme.Text.secondary))
                                        Text("Thinking...")
                                            .font(FlightPathFonts.body())
                                            .foregroundColor(FlightPathTheme.Text.secondary)
                                    }
                                    .padding(FlightPathTheme.Spacing.s12)
                                }
                                Spacer()
                            }
                            .padding(.horizontal, FlightPathTheme.Spacing.s16)
                        }
                    }
                    .padding(FlightPathTheme.Spacing.s16)
                }
                .frame(maxHeight: .infinity)

                // Input area
                VStack(spacing: FlightPathTheme.Spacing.s8) {
                    HStack(spacing: FlightPathTheme.Spacing.s8) {
                        TextField("Ask about Flight Path...", text: $messageText)
                            .font(FlightPathFonts.body())
                            .foregroundColor(FlightPathTheme.Text.primary)
                            .padding(FlightPathTheme.Spacing.s12)
                            .background(FlightPathTheme.Background.secondary)
                            .cornerRadius(FlightPathTheme.Radius.medium)
                            .overlay(
                                RoundedRectangle(cornerRadius: FlightPathTheme.Radius.medium)
                                    .stroke(FlightPathTheme.Border.subtle, lineWidth: 1)
                            )
                            .focused($isInputFocused)
                            .onSubmit {
                                sendMessage()
                            }

                        Button {
                            sendMessage()
                        } label: {
                            Image(systemName: "arrow.up.circle.fill")
                                .font(.title)
                                .foregroundColor(canSend ? FlightPathTheme.Accent.primary : FlightPathTheme.Text.tertiary)
                        }
                        .disabled(!canSend || isTyping)
                    }
                    .padding(.horizontal, FlightPathTheme.Spacing.s16)
                    .padding(.vertical, FlightPathTheme.Spacing.s8)
                }
                .background(FlightPathTheme.Background.secondary.opacity(0.5))
            }
            .navigationTitle("Chat")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        clearChat()
                    } label: {
                        Image(systemName: "trash")
                            .foregroundColor(FlightPathTheme.Text.primary)
                    }
                }
            }
        }
    }

    private var canSend: Bool {
        !messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func sendMessage() {
        guard canSend else { return }

        let userMessage = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
        messageText = ""
        isInputFocused = false

        // Add user message
        let userChatMessage = ChatMessage(role: .user, content: userMessage)
        viewModel.chatMessages.append(userChatMessage)

        // Show typing indicator
        isTyping = true

        Task {
            do {
                // Send message to backend
                let response = try await APIService.shared.sendChat(message: userMessage)

                // Add assistant message with sources
                let sources = response.sources.map { Source(fromAPIResponse: $0) }
                let assistantMessage = ChatMessage(
                    role: .assistant,
                    content: response.answer,
                    sources: sources
                )

                await MainActor.run {
                    viewModel.chatMessages.append(assistantMessage)
                    isTyping = false
                }
            } catch {
                await MainActor.run {
                    // Add error message
                    let errorMessage = ChatMessage(
                        role: .assistant,
                        content: "Sorry, I couldn't process that request. Please make sure the backend is running and try again."
                    )
                    viewModel.chatMessages.append(errorMessage)
                    isTyping = false
                }
            }
        }
    }

    private func clearChat() {
        withAnimation {
            viewModel.chatMessages.removeAll()
        }
    }
}

#Preview {
    NavigationStack {
        ChatView(viewModel: ModuleViewModel())
    }
}
