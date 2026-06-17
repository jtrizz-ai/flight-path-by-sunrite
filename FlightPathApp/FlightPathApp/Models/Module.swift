import Foundation

// MARK: - Tag
struct Tag: Codable, Identifiable {
    let id: String
    let name: String
    let color: String?
}

// MARK: - ContentBlock
struct ContentBlock: Codable, Identifiable {
    let id: String // Auto-generated when parsing
    let type: BlockType
    let text: String
    let checked: Bool?
    let level: Int?

    enum BlockType: String, Codable {
        case paragraph
        case heading_1
        case heading_2
        case heading_3
        case bullet_list
        case numbered_list
        case todo
    }

    // Custom coding to handle block type mapping
    enum CodingKeys: String, CodingKey {
        case type, text, checked, level
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.type = try container.decode(BlockType.self, forKey: .type)
        self.text = try container.decode(String.self, forKey: .text)
        self.checked = try container.decodeIfPresent(Bool.self, forKey: .checked)
        self.level = try container.decodeIfPresent(Int.self, forKey: .level)
        self.id = UUID().uuidString // Generate ID for Identifiable conformance
    }

    init(type: BlockType, text: String, checked: Bool? = nil, level: Int? = nil) {
        self.id = UUID().uuidString
        self.type = type
        self.text = text
        self.checked = checked
        self.level = level
    }
}

// MARK: - Module
struct Module: Codable, Identifiable {
    let id: String
    let title: String
    let tags: [Tag]
    let lastEditedTime: String
    let verified: Bool
    let contentBlocks: [ContentBlock]?

    private enum CodingKeys: String, CodingKey {
        case id, title, tags, verified
        case lastEditedTime = "last_edited_time"
        case contentBlocks = "content_blocks"
    }

    // Helper to format date
    var formattedDate: String {
        let isoDate = ISO8601DateFormatter()
        if let date = isoDate.date(from: lastEditedTime) {
            let formatter = RelativeDateTimeFormatter()
            formatter.unitsStyle = .abbreviated
            return formatter.localizedString(for: date, relativeTo: Date())
        }
        return "Unknown date"
    }

    // Helper to check if module has content
    var hasContent: Bool {
        return !(contentBlocks?.isEmpty ?? true)
    }
}
