import Foundation

// MARK: - API Error
enum APIError: Error, LocalizedError {
    case invalidURL
    case networkError(Error)
    case decodingError(Error)
    case serverError(String)
    case noData

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
        }
    }
}

// MARK: - API Response
struct HealthResponse: Codable {
    let status: String
    let timestamp: String
}

// MARK: - API Service
class APIService {
    static let shared = APIService()

    private let baseURL: String
    private let session: URLSession

    private init() {
        // Update this to match your backend URL
        // For local development, use localhost
        // For iOS simulator, localhost works fine
        self.baseURL = "http://localhost:3000/api"

        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30.0
        configuration.timeoutIntervalForResource = 60.0
        self.session = URLSession(configuration: configuration)
    }

    // MARK: - Health Check
    func checkHealth() async throws -> HealthResponse {
        guard let url = URL(string: "\(baseURL)/health") else {
            throw APIError.invalidURL
        }

        let (data, response) = try await session.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError(URLError(.badServerResponse))
        }

        guard httpResponse.statusCode == 200 else {
            throw APIError.serverError("HTTP \(httpResponse.statusCode)")
        }

        do {
            return try JSONDecoder().decode(HealthResponse.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    // MARK: - Fetch All Modules
    func fetchModules() async throws -> [Module] {
        guard let url = URL(string: "\(baseURL)/modules") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError(URLError(.badServerResponse))
        }

        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIError.serverError("HTTP \(httpResponse.statusCode): \(errorMessage)")
        }

        do {
            return try JSONDecoder().decode([Module].self, from: data)
        } catch {
            print("Decoding error: \(error)")
            throw APIError.decodingError(error)
        }
    }

    // MARK: - Fetch Single Module
    func fetchModule(id: String) async throws -> Module {
        guard let url = URL(string: "\(baseURL)/modules/\(id)") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError(URLError(.badServerResponse))
        }

        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIError.serverError("HTTP \(httpResponse.statusCode): \(errorMessage)")
        }

        do {
            return try JSONDecoder().decode(Module.self, from: data)
        } catch {
            print("Decoding error: \(error)")
            throw APIError.decodingError(error)
        }
    }
}
