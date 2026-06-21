import SwiftUI

struct ProfileView: View {
    @ObservedObject var app: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var fullName = ""
    @State private var avatarUrl = ""
    @State private var phone = ""
    @State private var town = ""
    @State private var hireDate: Date = .now
    @State private var hireDateNone = false
    @State private var saving = false
    @State private var error: String?
    @State private var savedAt: Date?

    private let df: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    var body: some View {
        NavigationStack {
            Form {
                Section("Identity") {
                    LabeledContent("Email", value: app.user?.email ?? "")
                    TextField("Full name", text: $fullName)
                }
                Section("Profile") {
                    TextField("Avatar URL", text: $avatarUrl)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    TextField("Phone", text: $phone)
                    TextField("Town", text: $town)
                    Toggle("No hire date", isOn: $hireDateNone)
                    if !hireDateNone {
                        DatePicker("Hire date", selection: $hireDate, displayedComponents: .date)
                    }
                }
                if let error {
                    Text(error).foregroundStyle(Color(red: 232/255, green: 71/255, blue: 42/255))
                }
                if savedAt != nil {
                    Text("Saved.").foregroundStyle(.secondary).font(.caption)
                }
                Section {
                    Button(saving ? "Saving…" : "Save") {
                        Task { await save() }
                    }
                    .disabled(saving)
                }
                Section {
                    Button("Sign out", role: .destructive) {
                        Task {
                            await app.signOut()
                            dismiss()
                        }
                    }
                }
            }
            .navigationTitle("Profile")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .onAppear { populate() }
        }
    }

    private func populate() {
        guard let u = app.user else { return }
        fullName = u.fullName
        avatarUrl = u.avatarUrl ?? ""
        phone = u.phone ?? ""
        town = u.town ?? ""
        if let iso = u.hireDate, let d = df.date(from: iso) {
            hireDate = d
            hireDateNone = false
        } else {
            hireDateNone = true
        }
    }

    private func save() async {
        saving = true
        error = nil
        defer { saving = false }
        var patch = UserProfilePatch()
        patch.fullName = fullName
        patch.avatarUrl = avatarUrl.isEmpty ? nil : avatarUrl
        patch.phone = phone.isEmpty ? nil : phone
        patch.town = town.isEmpty ? nil : town
        patch.hireDate = hireDateNone ? nil : df.string(from: hireDate)
        do {
            let updated = try await APIClient.shared.updateProfile(patch)
            app.user = updated
            savedAt = .now
        } catch {
            self.error = error.localizedDescription
        }
    }
}
