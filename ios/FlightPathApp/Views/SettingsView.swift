import SwiftUI
import PhotosUI

struct SettingsView: View {
    @ObservedObject var app: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var backendURL: String = AppConfig.backendBaseURL
    @State private var testing = false
    @State private var testResult: String?

    // Avatar picker
    @State private var photoItem: PhotosPickerItem?
    @State private var uploadingAvatar = false
    @State private var avatarError: String?

    private let accentColor = Color(red: 232/255, green: 71/255, blue: 42/255)
    private let accent2Color = Color(red: 255/255, green: 138/255, blue: 91/255)

    private var isAdmin: Bool { app.user?.role == "Admin" }

    var body: some View {
        NavigationStack {
            Form {
                // ── Profile image (all users) ──
                Section("Your Image") {
                    HStack(spacing: 14) {
                        avatarView
                        VStack(alignment: .leading, spacing: 4) {
                            PhotosPicker(
                                selection: $photoItem,
                                matching: .images,
                                photoLibrary: .shared()
                            ) {
                                Text(uploadingAvatar ? "Uploading…" : "Choose Photo")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(accentColor)
                            }
                            .disabled(uploadingAvatar)
                            Text("PNG, JPEG, or WebP — under 5 MB")
                                .font(.system(size: 11))
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                    if let avatarError {
                        Text(avatarError)
                            .font(.caption)
                            .foregroundStyle(accentColor)
                    }
                }

                // ── Backend URL (admin only) ──
                if isAdmin {
                    Section("Backend") {
                        TextField("https://flightpath.tailbce7aa.ts.net", text: $backendURL)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                        Button("Save") {
                            AppConfig.backendBaseURL = backendURL.trimmingCharacters(in: .whitespacesAndNewlines)
                        }
                    }
                }

                // ── Connection (admin only — testing the backend) ──
                if isAdmin {
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
            .onChange(of: photoItem) { _, newItem in
                guard let newItem else { return }
                Task { await uploadAvatar(item: newItem) }
            }
        }
    }

    // MARK: - Avatar

    @ViewBuilder
    private var avatarView: some View {
        if let urlString = app.user?.avatarUrl, !urlString.isEmpty,
           let url = URL(string: AppConfig.backendBaseURLNormalized + urlString) {
            AsyncImage(url: url) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                Circle().fill(Color.line)
            }
            .frame(width: 56, height: 56)
            .clipShape(Circle())
            .overlay(Circle().stroke(Color.line, lineWidth: 1))
        } else {
            Text(app.userInitials)
                .font(FPFont.display(18))
                .foregroundColor(.white)
                .frame(width: 56, height: 56)
                .background(LinearGradient(colors: [accentColor, accent2Color], startPoint: .topLeading, endPoint: .bottomTrailing))
                .clipShape(Circle())
        }
    }

    private func uploadAvatar(item: PhotosPickerItem) async {
        uploadingAvatar = true
        avatarError = nil
        defer { uploadingAvatar = false }

        guard let data = try? await item.loadTransferable(type: Data.self) else {
            avatarError = "Could not load that image."
            return
        }

        // Detect the MIME type from the first bytes so the backend gets the right extension.
        let mimeType: String
        if data.prefix(4) == Data([0x89, 0x50, 0x4E, 0x47]) { mimeType = "image/png" }
        else if data.prefix(3) == Data([0xFF, 0xD8, 0xFF])    { mimeType = "image/jpeg" }
        else if data.prefix(4) == Data([0x52, 0x49, 0x46, 0x46]) { mimeType = "image/webp" }
        else if data.prefix(6) == Data([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]) { mimeType = "image/gif" }
        else { mimeType = "image/jpeg" }

        do {
            let avatarUrl = try await APIClient.shared.uploadAvatar(data: data, mimeType: mimeType)
            app.user?.avatarUrl = avatarUrl
        } catch {
            avatarError = error.localizedDescription
        }
    }
}
