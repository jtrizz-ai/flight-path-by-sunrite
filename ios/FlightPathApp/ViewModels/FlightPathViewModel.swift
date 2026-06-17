import SwiftUI
import Supabase

// MARK: - Connection Status
struct ConnectionStatus {
    let isConnected: Bool
    let message: String
}

// MARK: - Flight Path View Model
@MainActor
class FlightPathViewModel: ObservableObject {
    @Published var currentUser: UserProfile?
    @Published var pages: [FlightPathPage] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var connectionStatus: ConnectionStatus?
    @Published var totalPages = 0
    @Published var hiddenPages = 0

    private let supabase = SupabaseService.shared
    private let api = APIService.shared

    // MARK: - User Management
    func loadUserData() async {
        isLoading = true
        defer { isLoading = false }

        do {
            // Check if user is authenticated
            let hasSession = try await supabase.getSession()
            if hasSession {
                let user = try await supabase.getCurrentUser()
                self.currentUser = user
                APIService.shared.setAuthToken(user.id) // Set user ID as token for now
                await loadPages()
            } else {
                self.currentUser = nil
                APIService.shared.setAuthToken(nil)
            }
        } catch {
            print("Error loading user data: \(error)")
            self.currentUser = nil
        }
    }

    func signOut() async {
        do {
            try await supabase.signOut()
            self.currentUser = nil
            self.pages = []
            APIService.shared.setAuthToken(nil)
        } catch {
            print("Sign out error: \(error)")
        }
    }

    // MARK: - Page Management
    func loadPages() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let fetchedPages = try await api.fetchPages()
            self.pages = fetchedPages.filter { $0.can_access }
            self.totalPages = fetchedPages.count
            self.hiddenPages = fetchedPages.filter { $0.is_hidden }.count

            // Update connection status
            self.connectionStatus = ConnectionStatus(
                isConnected: true,
                message: "Connected to Flight Path"
            )
        } catch {
            print("Error loading pages: \(error)")
            self.errorMessage = error.localizedDescription
            self.connectionStatus = ConnectionStatus(
                isConnected: false,
                message: "Connection failed"
            )
        }
    }

    func refreshData() async {
        await loadUserData()
    }

    // MARK: - Page Details
    func fetchPageDetails(slug: String) async -> FlightPathPage? {
        isLoading = true
        defer { isLoading = false }

        do {
            return try await api.fetchPage(slug: slug)
        } catch {
            print("Error fetching page details: \(error)")
            self.errorMessage = error.localizedDescription
            return nil
        }
    }

    // MARK: - Health Check
    func checkConnection() async {
        do {
            let isConnected = try await api.checkHealth()
            self.connectionStatus = ConnectionStatus(
                isConnected: isConnected,
                message: isConnected ? "Connected to Flight Path" : "Connection failed"
            )
        } catch {
            self.connectionStatus = ConnectionStatus(
                isConnected: false,
                message: "Unable to connect"
            )
        }
    }
}
