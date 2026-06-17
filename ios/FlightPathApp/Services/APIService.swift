import SwiftUI

// MARK: - API Error
enum APIError: Error, LocalizedError {
    case invalidURL
    case networkError(Error)
    case decodingError(Error)
    case serverError(String)
    case noData
    case unauthorized(String)
    case forbidden(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError(let error):
            return "Decoding error: \(error.localizedDescription)"
        case .serverError(let message):
            return "Server error: \(message)"
        case .noData:
            return "No data received"
        case .unauthorized(let message):
            return "Authentication required: \(message)"
        case .forbidden(let message):
            return "Access denied: \(message)"
        }
    }
}

// MARK: - Page Models
struct FlightPathPage: Identifiable, Codable {
    let id: String
    let notion_page_id: String
    let parent_page_id: String?
    let title: String
    let slug: String
    let content: PageContent
    let url: String?
    let icon: String?
    let cover: String?
    let is_hidden: Bool
    let subscription_required: String?
    let can_access: Bool
    let last_synced_at: String
    let created_at: String
    let updated_at: String

    var requiresPremium: Bool {
        is_hidden && !can_access
    }
}

struct PageContent: Codable {
    let blocks: [ContentBlock]
    let properties: [String: Any]?

    private enum CodingKeys: String, CodingKey {
        case blocks, properties
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        blocks = try container.decode([ContentBlock].self, forKey: .blocks)

        // Handle properties as a dictionary
        if let propertiesDict = try? container.decode([String: Any].self, forKey: .properties) {
            properties = propertiesDict
        } else {
            properties = nil
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(blocks, forKey: .blocks)
    }
}

// MARK: - Content Block Models
struct ContentBlock: Codable, Identifiable {
    let id: String
    let type: String
    let content: BlockContent
    let has_children: Bool?

    var blockId: String {
        id
    }
}

struct BlockContent: Codable {
    let text: String?
    let plain_text: String?
    let rich_text: [RichText]?
    let number: Int?
    let checked: Bool?
    let icon: String?
    let code: String?
    let children: [ContentBlock]?

    private enum CodingKeys: String, CodingKey {
        case text, plain_text, rich_text, number, checked, icon, code, children
    }
}

struct RichText: Codable {
    let plain_text: String
    let annotations: TextAnnotations?
    let type: String
}

struct TextAnnotations: Codable {
    let bold: Bool?
    let italic: Bool?
    let underline: Bool?
    let strikethrough: Bool?
    let code: Bool?
}

// MARK: - API Response
struct PagesResponse: Codable {
    let pages: [FlightPathPage]
}

// MARK: - API Service
class APIService {
    static let shared = APIService()

    // MARK: - Configuration
    private let baseURL: String
    private let session: URLSession
    private var authToken: String?

    private init() {
        // Update this to match your web app URL
        // For local development, use localhost
        // For iOS simulator, localhost works fine
        self.baseURL = "http://localhost:3000/api"

        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30.0
        configuration.timeoutIntervalForResource = 60.0
        self.session = URLSession(configuration: configuration)
    }

    // MARK: - Authentication Token Management
    func setAuthToken(_ token: String?) {
        self.authToken = token
    }

    // MARK: - Health Check
    func checkHealth() async throws -> Bool {
        guard let url = URL(string: "\(baseURL)/pages") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (_, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError(URLError(.badServerResponse))
        }

        return httpResponse.statusCode == 200
    }

    // MARK: - Fetch All Pages
    func fetchPages() async throws -> [FlightPathPage] {
        guard let url = URL(string: "\(baseURL)/pages") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError(URLError(.badServerResponse))
        }

        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            if httpResponse.statusCode == 401 {
                throw APIError.unauthorized("Please sign in to access content")
            } else if httpResponse.statusCode == 403 {
                throw APIError.forbidden("You don't have access to this content")
            }
            throw APIError.serverError("HTTP \(httpResponse.statusCode): \(errorMessage)")
        }

        do {
            let pagesResponse = try JSONDecoder().decode(PagesResponse.self, from: data)
            return pagesResponse.pages
        } catch {
            print("Pages decoding error: \(error)")
            throw APIError.decodingError(error)
        }
    }

    // MARK: - Fetch Page by Slug
    func fetchPage(slug: String) async throws -> FlightPathPage {
        guard let url = URL(string: "\(baseURL)/pages?slug=\(slug)") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError(URLError(.badServerResponse))
        }

        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            if httpResponse.statusCode == 404 {
                throw APIError.serverError("Page not found")
            } else if httpResponse.statusCode == 403 {
                throw APIError.forbidden("This content requires a premium subscription")
            }
            throw APIError.serverError("HTTP \(httpResponse.statusCode): \(errorMessage)")
        }

        do {
            let pagesResponse = try JSONDecoder().decode(PagesResponse.self, from: data)
            guard let page = pagesResponse.pages.first else {
                throw APIError.serverError("No page data found")
            }
            return page
        } catch {
            print("Page decoding error: \(error)")
            throw APIError.decodingError(error)
        }
    }

    // MARK: - Trigger Manual Crawl
    func triggerCrawl() async throws -> Bool {
        // This would typically call your worker API
        // For now, we'll return true and implement the actual endpoint later
        return true
    }
}
