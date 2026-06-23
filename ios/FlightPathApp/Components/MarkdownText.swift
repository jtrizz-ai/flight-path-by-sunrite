import SwiftUI
import Foundation

/// Renders a markdown string as styled content inside SwiftUI.
/// Handles headings, bold, italic, inline code, bullet lists, numbered lists,
/// blockquotes, code blocks, and GFM-style markdown tables.
///
/// Tables are parsed and rendered as native stacked row views (not raw pipes).
/// Literal `<br>` tags are converted to real line breaks.
struct MarkdownText: View {
    let text: String
    let baseFont: Font

    init(_ text: String, baseFont: Font = FPFont.sans(13.5)) {
        self.text = text
        self.baseFont = baseFont
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(Array(renderedSegments.enumerated()), id: \.offset) { _, segment in
                switch segment {
                case .text(let attrString):
                    Text(attrString)
                        .lineSpacing(5)
                        .environment(\.openURL, OpenURLAction { _ in .handled })
                case .table(let header, let rows):
                    MarkdownTableView(header: header, rows: rows, baseFont: baseFont)
                }
            }
        }
    }

    // MARK: - Segment model

    private enum RenderedSegment {
        case text(AttributedString)
        case table(header: [String], rows: [[String]])
    }

    // MARK: - Preprocessing + segmentation

    private var renderedSegments: [RenderedSegment] {
        let cleaned = preprocess(text)
        let lines = cleaned.components(separatedBy: "\n")
        var segments: [RenderedSegment] = []
        var textBuffer: [String] = []
        var inCodeBlock = false

        func flushText() {
            guard !textBuffer.isEmpty else { return }
            let attr = buildAttributedString(textBuffer)
            if !attr.characters.isEmpty {
                segments.append(.text(attr))
            }
            textBuffer.removeAll()
        }

        var i = 0
        while i < lines.count {
            let line = lines[i]
            let trimmed = line.trimmingCharacters(in: .whitespaces)

            // Code fence toggle — defer everything inside to text buffer
            if trimmed.hasPrefix("```") {
                textBuffer.append(line)
                inCodeBlock.toggle()
                i += 1
                continue
            }
            if inCodeBlock {
                textBuffer.append(line)
                i += 1
                continue
            }

            // Table detection: line starts with "|" and next line is a separator
            if trimmed.hasPrefix("|") && i + 1 < lines.count {
                let nextTrimmed = lines[i + 1].trimmingCharacters(in: .whitespaces)
                if isTableSeparator(nextTrimmed) {
                    flushText()
                    var tableLines: [String] = []
                    while i < lines.count && lines[i].trimmingCharacters(in: .whitespaces).hasPrefix("|") {
                        tableLines.append(lines[i].trimmingCharacters(in: .whitespaces))
                        i += 1
                    }
                    if let table = parseTable(tableLines) {
                        segments.append(.table(header: table.header, rows: table.rows))
                    }
                    continue
                }
            }

            textBuffer.append(line)
            i += 1
        }

        flushText()
        return segments
    }

    private func preprocess(_ raw: String) -> String {
        raw
            .replacingOccurrences(of: "<br />", with: "\n", options: .caseInsensitive)
            .replacingOccurrences(of: "<br/>", with: "\n", options: .caseInsensitive)
            .replacingOccurrences(of: "<br>", with: "\n", options: .caseInsensitive)
    }

    // MARK: - Table parsing

    private func isTableSeparator(_ line: String) -> Bool {
        line.contains("-") && line.allSatisfy {
            $0 == "|" || $0 == "-" || $0 == ":" || $0 == " " || $0 == "\t"
        }
    }

    private func parseTable(_ lines: [String]) -> (header: [String], rows: [[String]])? {
        guard lines.count >= 2 else { return nil }
        let header = parseTableRow(lines[0])
        var rows: [[String]] = []
        for index in 2..<lines.count {
            rows.append(parseTableRow(lines[index]))
        }
        return (header, rows)
    }

    private func parseTableRow(_ line: String) -> [String] {
        var s = line.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("|") { s = String(s.dropFirst()) }
        if s.hasSuffix("|") { s = String(s.dropLast()) }
        return s.components(separatedBy: "|").map { $0.trimmingCharacters(in: .whitespaces) }
    }

    // MARK: - AttributedString builder (for text segments)

    private func buildAttributedString(_ lines: [String]) -> AttributedString {
        var output = AttributedString()
        var inCodeBlock = false
        var codeBlockLines: [String] = []

        for line in lines {
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

        if inCodeBlock && !codeBlockLines.isEmpty {
            output.append(formatCodeBlock(codeBlockLines))
        }

        return output
    }

    // MARK: - Per-line formatting

    private func formatLine(_ rawLine: String) -> AttributedString? {
        let line = rawLine
        let trimmed = line.trimmingCharacters(in: .whitespaces)

        if trimmed.hasPrefix("```") { return nil }

        // Blank line -> paragraph break
        if trimmed.isEmpty {
            return AttributedString("\n\n")
        }

        // Headings
        if trimmed.hasPrefix("# ") || trimmed.hasPrefix("## ") || trimmed.hasPrefix("### ") {
            return formatHeading(trimmed)
        }

        // Bullet items
        if trimmed.hasPrefix("- ") || trimmed.hasPrefix("* ") || trimmed.hasPrefix("+ ") {
            let content = String(trimmed.dropFirst(2))
            return formatListItem(prefix: "  •  ", content: content)
        }

        // Numbered items
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

// MARK: - Native markdown table view

/// Renders a GFM markdown table as a native SwiftUI stacked layout:
/// an emphasized header row with a subtle background, followed by data rows
/// separated by thin Azurio borders.  Each column flexes equally.
private struct MarkdownTableView: View {
    let header: [String]
    let rows: [[String]]
    let baseFont: Font

    var body: some View {
        VStack(spacing: 0) {
            // Header row
            HStack(spacing: 0) {
                ForEach(Array(header.enumerated()), id: \.offset) { _, cell in
                    Text(parseCell(cell, isHeader: true))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 8)
                }
            }
            .background(Color.white.opacity(0.04))

            // Data rows
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                HStack(spacing: 0) {
                    ForEach(Array(row.enumerated()), id: \.offset) { _, cell in
                        Text(parseCell(cell, isHeader: false))
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                    }
                }
                .overlay(Rectangle().fill(Color.line).frame(height: 1), alignment: .top)
            }
        }
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.line, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private func parseCell(_ text: String, isHeader: Bool) -> AttributedString {
        do {
            var attr = try AttributedString(
                markdown: text,
                options: AttributedString.MarkdownParsingOptions(
                    interpretedSyntax: .inlineOnlyPreservingWhitespace
                )
            )
            var container = AttributeContainer()
            container.font = isHeader ? baseFont.bold() : baseFont
            container.foregroundColor = isHeader ? Color.ink : Color.ink2
            attr.mergeAttributes(container)
            return attr
        } catch {
            var attr = AttributedString(text)
            attr.font = isHeader ? baseFont.bold() : baseFont
            attr.foregroundColor = isHeader ? Color.ink : Color.ink2
            return attr
        }
    }
}
