import SwiftUI

struct PageDetailView: View {
    let page: FlightPathPage
    @StateObject private var viewModel = FlightPathViewModel()
    @State private var isLoadingPage = false

    var body: some View {
        FlightPathBackground {
            NavigationStack {
                Group {
                    if page.requiresPremium {
                        premiumLockView
                    } else {
                        contentView
                    }
                }
                .navigationTitle(page.title)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button {
                            // Share functionality could be added here
                        } label: {
                            Image(systemName: "square.and.arrow.up")
                                .foregroundColor(FlightPathTheme.Text.primary)
                        }
                    }
                }
            }
        }
        .onAppear {
            if !page.requiresPremium {
                loadPageContent()
            }
        }
    }

    private var premiumLockView: some View {
        VStack(spacing: FlightPathTheme.Spacing.s32) {
            Spacer()

            // Lock icon
            VStack(spacing: FlightPathTheme.Spacing.s16) {
                Image(systemName: "lock.fill")
                    .font(.system(size: 64))
                    .foregroundColor(FlightPathTheme.Accent.primary)

                Text("Premium Content")
                    .font(FlightPathFonts.display(size: 28))
                    .foregroundColor(FlightPathTheme.Text.primary)
            }

            // Description
            VStack(spacing: FlightPathTheme.Spacing.s12) {
                Text("This content is available for premium subscribers only.")
                    .font(FlightPathFonts.body())
                    .foregroundColor(FlightPathTheme.Text.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, FlightPathTheme.Spacing.s32)

                // Features
                VStack(spacing: FlightPathTheme.Spacing.s8) {
                    premiumFeature("Access to all exclusive content")
                    premiumFeature("Early access to new material")
                    premiumFeature("Support for ongoing development")
                }
                .padding(.horizontal, FlightPathTheme.Spacing.s32)
            }

            // Upgrade button
            Button {
                // This would open subscription management
            } label: {
                HStack {
                                            Image(systemName: "crown.fill")
                    Text("Upgrade to Premium")
                        .font(FlightPathFonts.body())
                }
                .frame(maxWidth: .infinity)
                .padding(FlightPathTheme.Spacing.s16)
                .background(FlightPathTheme.Accent.primary)
                .foregroundColor(FlightPathTheme.Background.primary)
                .cornerRadius(FlightPathTheme.Radius.medium)
            }
            .padding(.horizontal, FlightPathTheme.Spacing.s32)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var contentView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s24) {
                // Cover Image
                if let cover = page.cover, let url = URL(string: cover) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .empty:
                            Rectangle()
                                .fill(FlightPathTheme.Background.secondary)
                        case .success(let image):
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        case .failure:
                            Rectangle()
                                .fill(FlightPathTheme.Background.secondary)
                                .overlay(
                                    Image(systemName: "photo")
                                        .foregroundColor(FlightPathTheme.Text.tertiary)
                                )
                        @unknown default:
                            Rectangle()
                                .fill(FlightPathTheme.Background.secondary)
                        }
                    }
                    .frame(height: 250)
                    .cornerRadius(FlightPathTheme.Radius.medium)
                    .clipped()
                }

                // Page Header
                VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s12) {
                    // Icon and Title
                    HStack(alignment: .top, spacing: FlightPathTheme.Spacing.s12) {
                        if let icon = page.icon {
                            Text(icon)
                                .font(.system(size: 48))
                        }

                        VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s8) {
                            Text(page.title)
                                .font(FlightPathFonts.display(size: 32))
                                .foregroundColor(FlightPathTheme.Text.primary)

                            // Metadata
                            HStack(spacing: FlightPathTheme.Spacing.s8) {
                                MonoLabel(text: "CONTENT PAGE")

                                if page.is_hidden {
                                    HStack(spacing: FlightPathTheme.Spacing.s4) {
                                        Image(systemName: "lock.fill")
                                            .font(.system(size: 8))
                                            .foregroundColor(FlightPathTheme.Accent.primary)
                                        Text("Premium")
                                            .font(FlightPathFonts.body(size: 10))
                                            .foregroundColor(FlightPathTheme.Accent.primary)
                                    }
                                }
                            }
                        }

                        Spacer()
                    }

                    // Last updated
                    HStack(spacing: FlightPathTheme.Spacing.s4) {
                        Image(systemName: "clock")
                            .font(.system(size: 10))
                            .foregroundColor(FlightPathTheme.Text.tertiary)
                        Text("Updated \(timeAgoString(from: page.updated_at))")
                            .font(FlightPathFonts.body(size: 12))
                            .foregroundColor(FlightPathTheme.Text.secondary)
                    }
                }
                .padding(FlightPathTheme.Spacing.s20)

                // Content Blocks
                if isLoadingPage {
                    loadingView
                } else {
                    contentBlocksView
                }
            }
            .padding(FlightPathTheme.Spacing.s24)
        }
    }

    private var loadingView: some View {
        VStack(spacing: FlightPathTheme.Spacing.s16) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: FlightPathTheme.Accent.primary))
            Text("Loading content...")
                .font(FlightPathFonts.body())
                .foregroundColor(FlightPathTheme.Text.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 50)
    }

    private var contentBlocksView: some View {
        VStack(alignment: .leading, spacing: FlightPathTheme.Spacing.s16) {
            ForEach(page.content.blocks, id: \.blockId) { block in
                ContentBlockView(block: block)
            }
        }
    }

    private func loadPageContent() {
        isLoadingPage = true
        // In a real app, you might need to fetch detailed content here
        // For now, we're using the content already loaded in the page object
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            isLoadingPage = false
        }
    }

    private func premiumFeature(_ text: String) -> some View {
        HStack(spacing: FlightPathTheme.Spacing.s8) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(FlightPathTheme.Accent.primary)
            Text(text)
                .font(FlightPathFonts.body())
                .foregroundColor(FlightPathTheme.Text.primary)
        }
    }

    private func timeAgoString(from dateString: String) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated

        guard let date = ISO8601DateFormatter().date(from: dateString) else {
            return "Unknown"
        }

        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Content Block View
struct ContentBlockView: View {
    let block: ContentBlock

    var body: some View {
        Group {
            switch block.type {
            case "paragraph":
                ParagraphBlock(content: block.content)
            case "heading_1":
                HeadingBlock(content: block.content, level: 1)
            case "heading_2":
                HeadingBlock(content: block.content, level: 2)
            case "heading_3":
                HeadingBlock(content: block.content, level: 3)
            case "bulleted_list":
                BulletedListItem(content: block.content)
            case "numbered_list":
                NumberedListItem(content: block.content)
            case "to_do":
                ToDoItem(content: block.content)
            case "callout":
                CalloutBlock(content: block.content)
            case "quote":
                QuoteBlock(content: block.content)
            case "divider":
                DividerBlock()
            case "code":
                CodeBlock(content: block.content)
            case "toggle":
                ToggleBlock(content: block.content)
            case "child_page":
                ChildPageBlock(content: block.content)
            default:
                UnknownBlock(type: block.type)
            }
        }
    }
}

// MARK: - Block Components
struct ParagraphBlock: View {
    let content: BlockContent

    var body: some View {
        Text(content.text ?? content.plain_text ?? "")
            .font(FlightPathFonts.body())
            .foregroundColor(FlightPathTheme.Text.primary)
            .padding(.vertical, FlightPathTheme.Spacing.s8)
    }
}

struct HeadingBlock: View {
    let content: BlockContent
    let level: Int

    var body: some View {
        let text = content.text ?? content.plain_text ?? ""
        switch level {
        case 1:
            return Text(text)
                .font(FlightPathFonts.display(size: 28))
                .foregroundColor(FlightPathTheme.Text.primary)
                .padding(.vertical, FlightPathTheme.Spacing.s12)
        case 2:
            return Text(text)
                .font(FlightPathFonts.heading())
                .foregroundColor(FlightPathTheme.Text.primary)
                .padding(.vertical, FlightPathTheme.Spacing.s8)
        case 3:
            return Text(text)
                .font(FlightPathFonts.subheading())
                .foregroundColor(FlightPathTheme.Text.primary)
                .padding(.vertical, FlightPathTheme.Spacing.s8)
        default:
            return Text(text)
                .font(FlightPathFonts.heading())
                .foregroundColor(FlightPathTheme.Text.primary)
        }
    }
}

struct BulletedListItem: View {
    let content: BlockContent

    var body: some View {
        HStack(alignment: .top, spacing: FlightPathTheme.Spacing.s8) {
            Text("•")
                .foregroundColor(FlightPathTheme.Accent.primary)
                .font(.system(size: 14))
            Text(content.text ?? content.plain_text ?? "")
                .font(FlightPathFonts.body())
                .foregroundColor(FlightPathTheme.Text.primary)
        }
        .padding(.vertical, FlightPathTheme.Spacing.s4)
    }
}

struct NumberedListItem: View {
    let content: BlockContent

    var body: some View {
        HStack(alignment: .top, spacing: FlightPathTheme.Spacing.s8) {
            Text("\(content.number ?? 1).")
                .foregroundColor(FlightPathTheme.Accent.primary)
                .font(.system(size: 12))
            Text(content.text ?? content.plain_text ?? "")
                .font(FlightPathFonts.body())
                .foregroundColor(FlightPathTheme.Text.primary)
        }
        .padding(.vertical, FlightPathTheme.Spacing.s4)
    }
}

struct ToDoItem: View {
    let content: BlockContent

    var body: some View {
        HStack(spacing: FlightPathTheme.Spacing.s12) {
            Image(systemName: (content.checked ?? false) ? "checkmark.square.fill" : "square")
                .foregroundColor(FlightPathTheme.Accent.primary)
            Text(content.text ?? content.plain_text ?? "")
                .font(FlightPathFonts.body())
                .foregroundColor(content.checked ?? false ? FlightPathTheme.Text.tertiary : FlightPathTheme.Text.primary)
                .strikethrough(content.checked ?? false)
        }
        .padding(FlightPathTheme.Spacing.s12)
        .background(FlightPathTheme.Background.secondary)
        .cornerRadius(FlightPathTheme.Radius.small)
    }
}

struct CalloutBlock: View {
    let content: BlockContent

    var body: some View {
        HStack(spacing: FlightPathTheme.Spacing.s12) {
            if let icon = content.icon {
                Text(icon)
                    .font(.system(size: 20))
            }

            Text(content.text ?? content.plain_text ?? "")
                .font(FlightPathFonts.body())
                .foregroundColor(FlightPathTheme.Text.primary)
        }
        .padding(FlightPathTheme.Spacing.s16)
        .background(FlightPathTheme.Accent.primary.opacity(0.1))
        .overlay(
            RoundedRectangle(cornerRadius: FlightPathTheme.Radius.small)
                .stroke(FlightPathTheme.Accent.primary, lineWidth: 1)
        )
        .cornerRadius(FlightPathTheme.Radius.small)
    }
}

struct QuoteBlock: View {
    let content: BlockContent

    var body: some View {
        HStack(spacing: FlightPathTheme.Spacing.s12) {
            Rectangle()
                .fill(FlightPathTheme.Accent.primary)
                .frame(width: 4)

            Text(content.text ?? content.plain_text ?? "")
                .font(FlightPathFonts.body(size: 16))
                .italic()
                .foregroundColor(FlightPathTheme.Text.primary)
        }
        .padding(.vertical, FlightPathTheme.Spacing.s8)
    }
}

struct DividerBlock: View {
    var body: some View {
        Rectangle()
            .fill(FlightPathTheme.Border.subtle)
            .frame(height: 1)
            .padding(.vertical, FlightPathTheme.Spacing.s16)
    }
}

struct CodeBlock: View {
    let content: BlockContent

    var body: some View {
        Text(content.text ?? content.code ?? content.plain_text ?? "")
            .font(.system(size: 14, design: .monospaced))
            .foregroundColor(FlightPathTheme.Text.primary)
            .padding(FlightPathTheme.Spacing.s16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(FlightPathTheme.Background.secondary)
            .cornerRadius(FlightPathTheme.Radius.small)
    }
}

struct ToggleBlock: View {
    let content: BlockContent

    var body: some View {
        DisclosureGroup {
            Text(content.text ?? content.plain_text ?? "")
                .font(FlightPathFonts.body())
                .foregroundColor(FlightPathTheme.Text.primary)
        } label: {
            EmptyView()
        }
    }
}

struct ChildPageBlock: View {
    let content: BlockContent

    var body: some View {
        HStack(spacing: FlightPathTheme.Spacing.s12) {
            Image(systemName: "doc.text")
                .foregroundColor(FlightPathTheme.Accent.primary)
            Text("Child Page")
                .font(FlightPathFonts.body())
                .foregroundColor(FlightPathTheme.Text.primary)
        }
        .padding(FlightPathTheme.Spacing.s12)
        .background(FlightPathTheme.Background.secondary)
        .cornerRadius(FlightPathTheme.Radius.small)
    }
}

struct UnknownBlock: View {
    let type: String

    var body: some View {
        Text("[Unsupported block type: \(type)]")
            .font(FlightPathFonts.body(size: 12))
            .foregroundColor(FlightPathTheme.Text.tertiary)
            .italic()
    }
}

#Preview {
    PageDetailView(page: FlightPathPage(
        id: "1",
        notion_page_id: "123",
        parent_page_id: nil,
        title: "Sample Page",
        slug: "sample-page",
        content: PageContent(blocks: [
            ContentBlock(
                id: "1",
                type: "paragraph",
                content: BlockContent(text: "This is a sample paragraph"),
                has_children: false
            ),
            ContentBlock(
                id: "2",
                type: "heading_1",
                content: BlockContent(text: "Heading"),
                has_children: false
            )
        ]),
        url: "https://notion.so/sample",
        icon: "📄",
        cover: nil,
        is_hidden: false,
        subscription_required: nil,
        can_access: true,
        last_synced_at: "2024-06-17T10:00:00Z",
        created_at: "2024-06-17T10:00:00Z",
        updated_at: "2024-06-17T10:00:00Z"
    ))
}