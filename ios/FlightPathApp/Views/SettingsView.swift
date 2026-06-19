import SwiftUI

struct SettingsView: View {
    @ObservedObject var app: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var backendURL: String = AppConfig.backendBaseURL
    @State private var testing = false
    @State private var testResult: String?

    private let accentColor = Color(red: 232/255, green: 71/255, blue: 42/255)

    var body: some View {
        NavigationStack {
            Form {
                Section("Backend") {
                    TextField("http://localhost:3000", text: $backendURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Button("Save") {
                        AppConfig.backendBaseURL = backendURL.trimmingCharacters(in: .whitespacesAndNewlines)
                    }
                }
                Section("Connection") {
                    Button(testing ? "Testing…" : "Test connection") {
                        testing = true
                        testResult = nil
                        Task {
                            do {
                                let h = try await APIClient.shared.health()
                                testResult = h.ok ? "OK — \(h.model ?? "?")" : "Fail: \(h.error ?? "?")"
                            } catch {
                                testResult = "Fail: \(error.localizedDescription)"
                            }
                            testing = false
                        }
                    }
                    if let testResult {
                        Text(testResult)
                            .font(.caption)
                            .foregroundStyle(accentColor)
                    }
                }
                Section("Account") {
                    Button("Sign out", role: .destructive) {
                        Task {
                            await app.signOut()
                            dismiss()
                        }
                    }
                }
                Section("About") {
                    HStack {
                        Text("App version")
                        Spacer()
                        Text("1.0").foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .onAppear { backendURL = AppConfig.backendBaseURL }
        }
    }
}
