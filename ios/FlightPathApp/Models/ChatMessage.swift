import Foundation

// MARK: - Chat Message
struct ChatMessage: Identifiable, Equatable {
    let id: String
    let role: MessageRole
    let content: String
    let timestamp: Date
    let sources: [Source]?

    enum MessageRole: String, Codable {
        case user
        case assistant
    }

    init(role: MessageRole, content: String, sources: [Source]? = nil) {
        self.id = UUID().uuidString
        self.role = role
        self.content = content
        self.timestamp = Date()
        self.sources = sources
    }

    static func == (lhs: ChatMessage, rhs: ChatMessage) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Source
struct Source: Codable, Identifiable, Equatable {
    let id: String
    let moduleId: String
    let title: String
    let snippet: String

    init(fromAPIResponse apiSource: APIService.Source) {
        self.id = UUID().uuidString
        self.moduleId = apiSource.moduleId
        self.title = apiSource.title
        self.snippet = apiSource.snippet
    }

    // For Equatable conformance
    static func == (lhs: Source, rhs: Source) -> Bool {
        lhs.id == rhs.id
    }
}
