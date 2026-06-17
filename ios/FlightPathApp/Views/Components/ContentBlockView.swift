import SwiftUI

struct ContentBlockView: View {
    let block: ContentBlock

    var body: some View {
        switch block.type {
        case .paragraph:
            ParagraphView(text: block.text)

        case .heading_1:
            HeadingView(text: block.text, level: 1)

        case .heading_2:
            HeadingView(text: block.text, level: 2)

        case .heading_3:
            HeadingView(text: block.text, level: 3)

        case .bullet_list:
            BulletListItemView(text: block.text)

        case .numbered_list:
            NumberedListItemView(text: block.text)

        case .todo:
            TodoItemView(text: block.text, checked: block.checked ?? false)

        case .callout:
            CalloutView(text: block.text, emoji: block.emoji)

        case .quote:
            QuoteView(text: block.text)

        case .divider:
            DividerView()

        case .code:
            CodeView(text: block.text, language: block.language)
        }
    }
}

// MARK: - Paragraph View
struct ParagraphView: View {
    let text: String

    var body: some View {
        Text(text)
            .font(FlightPathFonts.body())
            .foregroundColor(FlightPathTheme.Text.primary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, FlightPathTheme.Spacing.s4)
    }
}

// MARK: - Heading View
struct HeadingView: View {
    let text: String
    let level: Int

    var body: some View {
        Text(text)
            .font(font)
            .foregroundColor(FlightPathTheme.Text.primary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, FlightPathTheme.Spacing.s8)
    }

    private var font: Font {
        switch level {
        case 1: return FlightPathFonts.display(size: 28)
        case 2: return FlightPathFonts.display(size: 24)
        case 3: return FlightPathFonts.display(size: 20)
        default: return FlightPathFonts.display(size: 20)
        }
    }
}

// MARK: - Bullet List Item View
struct BulletListItemView: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: FlightPathTheme.Spacing.s8) {
            Circle()
                .fill(FlightPathTheme.Text.primary)
                .frame(width: 6, height: 6)
                .padding(.top, 8)

            Text(text)
                .font(FlightPathFonts.body())
                .foregroundColor(FlightPathTheme.Text.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, FlightPathTheme.Spacing.s2)
    }
}

// MARK: - Numbered List Item View
struct NumberedListItemView: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: FlightPathTheme.Spacing.s8) {
            Text("•")
                .font(FlightPathFonts.body())
                .foregroundColor(FlightPathTheme.Text.primary)
                .padding(.top, 4)

            Text(text)
                .font(FlightPathFonts.body())
                .foregroundColor(FlightPathTheme.Text.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, FlightPathTheme.Spacing.s2)
    }
}

// MARK: - Todo Item View
struct TodoItemView: View {
    let text: String
    let checked: Bool

    var body: some View {
        HStack(alignment: .center, spacing: FlightPathTheme.Spacing.s12) {
            Image(systemName: checked ? "checkmark.square.fill" : "square")
                .font(.title3)
                .foregroundColor(checked ? FlightPathTheme.Accent.primary : FlightPathTheme.Text.secondary)

            Text(text)
                .font(FlightPathFonts.body())
                .foregroundColor(FlightPathTheme.Text.primary)
                .strikethrough(checked, color: FlightPathTheme.Text.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, FlightPathTheme.Spacing.s4)
    }
}

// MARK: - Callout View
struct CalloutView: View {
    let text: String
    let emoji: String?

    var body: some View {
        HStack(alignment: .top, spacing: FlightPathTheme.Spacing.s12) {
            if let emoji = emoji {
                Text(emoji)
                    .font(.title)
            }

            Text(text)
                .font(FlightPathFonts.body())
                .foregroundColor(FlightPathTheme.Text.primary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(FlightPathTheme.Spacing.s16)
        .background(FlightPathTheme.Background.secondary)
        .cornerRadius(FlightPathTheme.Radius.medium)
        .overlay(
            RoundedRectangle(cornerRadius: FlightPathTheme.Radius.medium)
                .stroke(FlightPathTheme.Border.subtle, lineWidth: 1)
        )
        .padding(.vertical, FlightPathTheme.Spacing.s4)
    }
}

// MARK: - Quote View
struct QuoteView: View {
    let text: String

    var body: some View {
        HStack(spacing: FlightPathTheme.Spacing.s12) {
            RoundedRectangle(cornerRadius: FlightPathTheme.Radius.small)
                .fill(FlightPathTheme.Accent.primary)
                .frame(width: 4)

            Text(text)
                .font(FlightPathFonts.body())
                .italic()
                .foregroundColor(FlightPathTheme.Text.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, FlightPathTheme.Spacing.s4)
    }
}

// MARK: - Divider View
struct DividerView: View {
    var body: some View {
        Rectangle()
            .fill(FlightPathTheme.Border.subtle)
            .frame(height: 1)
            .padding(.vertical, FlightPathTheme.Spacing.s8)
    }
}

// MARK: - Code View
struct CodeView: View {
    let text: String
    let language: String?

    var body: some View {
        VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s8) {
            if let language = language {
                MonoLabel(text: language)
                    .padding(.horizontal, FlightPathTheme.Spacing.s12)
                    .padding(.top, FlightPathTheme.Spacing.s8)
            }

            Text(text)
                .font(FlightPathFonts.mono(size: 12))
                .foregroundColor(FlightPathTheme.Text.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(FlightPathTheme.Spacing.s12)
        }
        .background(FlightPathTheme.Background.secondary)
        .cornerRadius(FlightPathTheme.Radius.medium)
        .overlay(
            RoundedRectangle(cornerRadius: FlightPathTheme.Radius.medium)
                .stroke(FlightPathTheme.Border.subtle, lineWidth: 1)
        )
        .padding(.vertical, FlightPathTheme.Spacing.s4)
    }
}

#Preview {
    List {
        ContentBlockView(block: ContentBlock(type: .paragraph, text: "This is a paragraph with some text content."))

        ContentBlockView(block: ContentBlock(type: .heading_1, text: "Heading 1", level: 1))

        ContentBlockView(block: ContentBlock(type: .callout, text: "This is a callout with important information.", emoji: "💡"))

        ContentBlockView(block: ContentBlock(type: .quote, text: "This is a quote block."))

        ContentBlockView(block: ContentBlock(type: .divider, text: ""))

        ContentBlockView(block: ContentBlock(type: .code, text: "console.log('Hello, World!');", language: "javascript"))
    }
    .listStyle(.inset)
    .background(FlightPathTheme.Background.primary)
}
