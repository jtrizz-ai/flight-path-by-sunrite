import SwiftUI
import Foundation

/// Renders a markdown string as a styled AttributedString inside SwiftUI Text.
/// Handles headings, bold, italic, inline code, bullet lists, numbered lists,
/// blockquotes, and code blocks — the common markdown an LLM produces in chat.
struct MarkdownText: View {
    let text: String
    let baseFont: Font

    init(_ text: String, baseFont: Font = FPFont.sans(13.5)) {
        self.text = text
        self.baseFont = baseFont
    }

    var body: some View {
        Text(buildAttributedString())
            .environment(\.openURL, OpenURLAction { _ in .handled })
    }

    private func buildAttributedString() -> AttributedString {
        var output = AttributedString()
        let lines = text.components(separatedBy: "\n")
        var inCodeBlock = false
        var codeBlockLines: [String] = []

        for line in lines {
            // Toggle code fence
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            if trimmed.hasPrefix("```") {
                if inCodeBlock {
                    output.append(formatCodeBlock(codeBlockLines))
                    codeBlockLines.removeAll()
                    inCodeBlock = false
                } else {
                    inCodeBlock = true
                }
                continue
            }
            if inCodeBlock {
                codeBlockLines.append(line)
                continue
            }

            if let block = formatLine(line) {
                output.append(block)
            }
        }

        // Flush trailing code block
        if inCodeBlock && !codeBlockLines.isEmpty {
            output.append(formatCodeBlock(codeBlockLines))
        }

        return output
    }

    // MARK: - Per-line formatting

    private func formatLine(_ rawLine: String) -> AttributedString? {
        let line = rawLine
        let trimmed = line.trimmingCharacters(in: .whitespaces)

        // Skip raw fence markers that slipped through
        if trimmed.hasPrefix("```") { return nil }

        // Blank line -> paragraph break
        if trimmed.isEmpty {
            return AttributedString("\n\n")
        }

        // Headings: # ## ### ...
        if trimmed.hasPrefix("# ") || trimmed.hasPrefix("## ") || trimmed.hasPrefix("### ") {
            return formatHeading(trimmed)
        }

        // Bullet items: - * +
        if trimmed.hasPrefix("- ") || trimmed.hasPrefix("* ") || trimmed.hasPrefix("+ ") {
            let content = String(trimmed.dropFirst(2))
            return formatListItem(prefix: "  •  ", content: content)
        }

        // Numbered items: 1. 2. ...
        if let parsed = parseNumberedItem(trimmed) {
            return formatListItem(prefix: "  \(parsed.number).  ", content: parsed.content)
        }

        // Blockquote
        if trimmed.hasPrefix("> ") {
            let content = String(trimmed.dropFirst(2))
            var attr = parseInline(content)
            attr.foregroundColor = .ink3
            attr.font = baseFont.italic()
            return attr + AttributedString("\n")
        }

        // Horizontal rule
        if trimmed == "---" || trimmed == "***" || trimmed == "___" {
            return AttributedString("\n──────────\n\n")
        }

        // Default paragraph
        var attr = parseInline(trimmed)
        attr += AttributedString("\n")
        return attr
    }

    // MARK: - Block formatters

    private func formatHeading(_ trimmed: String) -> AttributedString {
        let level = trimmed.prefix(while: { $0 == "#" }).count
        let content = trimmed.drop(while: { $0 == "#" }).trimmingCharacters(in: .whitespaces)
        var attr = parseInline(content)
        attr.font = baseFont.bold()
        attr.foregroundColor = .ink
        switch level {
        case 1: attr.font = baseFont.bold()
        default: break
        }
        attr += AttributedString("\n")
        return attr
    }

    private func formatListItem(prefix: String, content: String) -> AttributedString {
        var bullet = AttributedString(prefix)
        bullet.foregroundColor = .ink3
        var body = parseInline(content)
        body.font = baseFont
        return bullet + body + AttributedString("\n")
    }

    private func formatCodeBlock(_ lines: [String]) -> AttributedString {
        let joined = lines.joined(separator: "\n")
        var attr = AttributedString("  " + joined)
        attr.font = .system(.caption, design: .monospaced)
        attr.foregroundColor = .ink2
        return AttributedString("\n") + attr + AttributedString("\n\n")
    }

    // MARK: - Inline parsing (bold, italic, code, links)

    private func parseInline(_ text: String) -> AttributedString {
        // Foundation's AttributedString(markdown:) handles **bold**, *italic*,
        // `code`, [text](url), ~~strike~~. Options must be requested.
        var container = AttributeContainer()
        container.font = baseFont
        container.foregroundColor = Color.ink

        do {
            var attr = try AttributedString(
                markdown: text,
                options: AttributedString.MarkdownParsingOptions(
                    interpretedSyntax: .inlineOnlyPreservingWhitespace
                )
            )
            attr.mergeAttributes(container)
            return attr
        } catch {
            var fallback = AttributedString(text)
            fallback.font = baseFont
            fallback.foregroundColor = .ink
            return fallback
        }
    }

    // MARK: - Numbered item parse

    private func parseNumberedItem(_ trimmed: String) -> (number: String, content: String)? {
        guard let dotIndex = trimmed.firstIndex(of: ".") else { return nil }
        let prefix = trimmed[trimmed.startIndex..<dotIndex]
        let numStr = String(prefix).trimmingCharacters(in: .whitespaces)
        guard numStr.allSatisfy(\.isNumber), !numStr.isEmpty else { return nil }
        let afterDot = trimmed.index(after: dotIndex)
        let content = trimmed[afterDot...].trimmingCharacters(in: .whitespaces)
        return (numStr, content)
    }
}
