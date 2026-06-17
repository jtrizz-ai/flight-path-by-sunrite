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
        }
    }
}

// MARK: - Paragraph View
struct ParagraphView: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.body)
            .foregroundStyle(.primary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 4)
    }
}

// MARK: - Heading View
struct HeadingView: View {
    let text: String
    let level: Int

    var body: some View {
        Text(text)
            .font(font)
            .fontWeight(.bold)
            .foregroundStyle(.primary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 8)
    }

    private var font: Font {
        switch level {
        case 1: return .title
        case 2: return .title2
        case 3: return .title3
        default: return .title3
        }
    }
}

// MARK: - Bullet List Item View
struct BulletListItemView: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Circle()
                .fill(.primary)
                .frame(width: 6, height: 6)
                .padding(.top, 8)

            Text(text)
                .font(.body)
                .foregroundStyle(.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Numbered List Item View
struct NumberedListItemView: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Text("•")
                .font(.body)
                .foregroundStyle(.primary)
                .padding(.top, 4)

            Text(text)
                .font(.body)
                .foregroundStyle(.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Todo Item View
struct TodoItemView: View {
    let text: String
    let checked: Bool

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            Image(systemName: checked ? "checkmark.square.fill" : "square")
                .font(.title3)
                .foregroundStyle(checked ? .green : .secondary)

            Text(text)
                .font(.body)
                .foregroundStyle(.primary)
                .strikethrough(checked, color: .secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    List {
        ContentBlockView(block: ContentBlock(type: .paragraph, text: "This is a paragraph with some text content."))

        ContentBlockView(block: ContentBlock(type: .heading_1, text: "Heading 1", level: 1))

        ContentBlockView(block: ContentBlock(type: .heading_2, text: "Heading 2", level: 2))

        ContentBlockView(block: ContentBlock(type: .heading_3, text: "Heading 3", level: 3))

        ContentBlockView(block: ContentBlock(type: .bullet_list, text: "Bullet list item"))

        ContentBlockView(block: ContentBlock(type: .numbered_list, text: "Numbered list item"))

        ContentBlockView(block: ContentBlock(type: .todo, text: "Todo item not checked", checked: false))

        ContentBlockView(block: ContentBlock(type: .todo, text: "Todo item checked", checked: true))
    }
    .listStyle(.inset)
}
