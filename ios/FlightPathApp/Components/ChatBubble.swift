import SwiftUI

// MARK: - Chat Bubble
struct ChatBubble: View {
    let message: ChatMessage

    var body: some View {
        VStack(alignment: alignment, spacing: FlightPathTheme.Spacing.s4) {
            // Message bubble
            HStack {
                if message.role == .assistant {
                    Spacer()
                }

                Text(message.content)
                    .font(FlightPathFonts.body())
                    .foregroundColor(textColor)
                    .padding(FlightPathTheme.Spacing.s16)
                    .background(bubbleColor)
                    .cornerRadius(FlightPathTheme.Radius.medium)

                if message.role == .user {
                    Spacer()
                }
            }

            // Sources (only for assistant messages)
            if message.role == .assistant, let sources = message.sources, !sources.isEmpty {
                VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s8) {
                    MonoLabel(text: "Sources")
                        .padding(.leading, FlightPathTheme.Spacing.s4)

                    ForEach(sources) { source in
                        SourceCitationCard(source: source)
                    }
                }
                .padding(.leading, FlightPathTheme.Spacing.s8)
            }
        }
        .frame(maxWidth: .infinity, alignment: alignment)
    }

    private var alignment: HorizontalAlignment {
        message.role == .user ? .trailing : .leading
    }

    private var bubbleColor: Color {
        switch message.role {
        case .user:
            return FlightPathTheme.Accent.primary
        case .assistant:
            return FlightPathTheme.Background.secondary
        }
    }

    private var textColor: Color {
        switch message.role {
        case .user:
            return FlightPathTheme.Background.primary
        case .assistant:
            return FlightPathTheme.Text.primary
        }
    }
}

// MARK: - Preview
#if DEBUG
struct ChatBubble_Previews: ViewProvider {
    static var previews: some View {
        VStack(spacing: FlightPathTheme.Spacing.s16) {
            ChatBubble(message: ChatMessage(
                role: .user,
                content: "What are the key principles of effective leadership?"
            ))

            ChatBubble(message: ChatMessage(
                role: .assistant,
                content: "Based on the Flight Path content, effective leadership involves several key principles including clear communication, strategic thinking, and emotional intelligence.",
                sources: [
                    Source(fromAPIResponse: APIService.Source(
                        moduleId: "1",
                        title: "Leadership Fundamentals",
                        snippet: "Effective leadership starts with clear communication..."
                    ))
                ]
            ))
        }
        .padding()
        .background(FlightPathTheme.Background.primary)
    }
}
#endif
