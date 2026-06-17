import Foundation

@MainActor
class ModuleViewModel: ObservableObject {
    @Published var modules: [Module] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var lastSyncTime: Date?
    @Published var isBackendConnected = false
    @Published var chatMessages: [ChatMessage] = []
    @Published var isLoadingChat = false

    private let apiService = APIService.shared

    // MARK: - Load Modules
    func loadModules() async {
        isLoading = true
        errorMessage = nil

        do {
            let fetchedModules = try await apiService.fetchModules()
            modules = fetchedModules
            lastSyncTime = Date()
            isBackendConnected = true
        } catch {
            errorMessage = error.localizedDescription
            isBackendConnected = false
            print("Error loading modules: \(error)")
        }

        isLoading = false
    }

    // MARK: - Load Single Module
    func loadModule(id: String) async throws -> Module {
        isLoading = true
        errorMessage = nil

        do {
            let module = try await apiService.fetchModule(id: id)
            isLoading = false
            isBackendConnected = true

            // Update the module in the array if it exists
            if let index = modules.firstIndex(where: { $0.id == module.id }) {
                modules[index] = module
            }

            return module
        } catch {
            errorMessage = error.localizedDescription
            isBackendConnected = false
            isLoading = false
            throw error
        }
    }

    // MARK: - Check Backend Health
    func checkBackendHealth() async -> Bool {
        do {
            let health = try await apiService.checkHealth()
            isBackendConnected = health.status == "ok"
            return isBackendConnected
        } catch {
            isBackendConnected = false
            errorMessage = error.localizedDescription
            return false
        }
    }

    // MARK: - Chat Methods
    func sendMessage(message: String) async {
        isLoadingChat = true
        errorMessage = nil

        // Add user message
        let userMessage = ChatMessage(role: .user, content: message)
        chatMessages.append(userMessage)

        do {
            // Call the chat API (this will be called from ChatView, so we skip it here)
            isLoadingChat = false
        } catch {
            errorMessage = error.localizedDescription
            isLoadingChat = false

            // Add error message
            let errorMessage = ChatMessage(
                role: .assistant,
                content: "Sorry, I couldn't process that request. Please try again."
            )
            chatMessages.append(errorMessage)
        }
    }

    func clearChat() {
        chatMessages.removeAll()
    }

    // MARK: - Computed Properties

    // Recently updated modules (sorted by date, most recent first)
    var recentModules: [Module] {
        modules.sorted { module1, module2 in
            module1.lastEditedTime > module2.lastEditedTime
        }.prefix(5).map { $0 }
    }

    // All unique tags from all modules
    var allTags: [Tag] {
        let allTags = modules.flatMap { $0.tags }
        // Remove duplicates while preserving order
        var seen = Set<String>()
        return allTags.filter { tag in
            seen.insert(tag.id).inserted
        }
    }

    // Filter modules by search text and tags
    func filterModules(searchText: String, selectedTags: Set<String>) -> [Module] {
        modules.filter { module in
            // Check if module matches any selected tag
            let matchesTag = selectedTags.isEmpty || module.tags.contains { tag in
                selectedTags.contains(tag.id)
            }

            // Check if module matches search text
            let matchesSearch = searchText.isEmpty ||
                module.title.localizedCaseInsensitiveContains(searchText)

            return matchesTag && matchesSearch
        }
    }
}
