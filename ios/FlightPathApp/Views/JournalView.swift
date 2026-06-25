import SwiftUI

// MARK: - Daily Journal
//
// Mirrors web/src/components/fp/DailyJournalView.tsx: a list of entries plus a
// detail/editor with three structured sections (Wins, Challenges, Tomorrow's
// Focus). Presented as a sheet from the SideDrawer.

struct JournalView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var entries: [JournalEntry] = []
    @State private var path: [JournalEntry] = []
    @State private var loading = true
    @State private var errorText: String?

    private let api = APIClient.shared

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                Color.fpBG.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        ViewHeader(
                            eyebrow: "REFLECT · GROW · REPEAT",
                            title: "Daily Journal",
                            subtitle: "Track your wins, challenges, and what's next."
                        )

                        Button {
                            createEntry()
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "plus")
                                    .font(.system(size: 14, weight: .bold))
                                Text("New Entry")
                                    .font(FPFont.mono(13, .bold))
                                    .tracking(1)
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(Color.fpAccent)
                            .overlay(
                                RoundedRectangle(cornerRadius: FPRadius.button)
                                    .stroke(Color.fpAccent, lineWidth: 1)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: FPRadius.button))
                        }
                        .buttonStyle(.plain)
                        .padding(.top, 4)
                        .padding(.bottom, 18)

                        if loading {
                            Text("Loading…")
                                .font(FPFont.mono(12))
                                .tracking(1)
                                .foregroundColor(.ink3)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 48)
                        } else if let err = errorText {
                            Text(err)
                                .font(FPFont.mono(11))
                                .foregroundColor(.fpAccent)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.vertical, 12)
                        } else if entries.isEmpty {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("No entries yet")
                                    .font(FPFont.mono(12))
                                    .tracking(1)
                                    .foregroundColor(.ink3)
                                Text("Tap “New Entry” to start your first journal entry.")
                                    .font(FPFont.sans(14))
                                    .foregroundColor(.ink2)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(20)
                            .cardSurface()
                        } else {
                            VStack(spacing: 12) {
                                ForEach(entries) { entry in
                                    Button {
                                        path.append(entry)
                                    } label: {
                                        EntryRow(entry: entry)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 22)
                    .padding(.bottom, 40)
                }
            }
            .navigationDestination(for: JournalEntry.self) { entry in
                JournalDetailView(entry: entry, onDeleted: { handleDeleted(entry) })
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("DAILY JOURNAL")
                        .font(FPFont.mono(12, .bold))
                        .tracking(2.4)
                        .foregroundColor(.ink)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(FPFont.mono(11, .bold))
                        .foregroundColor(.fpAccent2)
                }
            }
        }
        .task { await fetchEntries() }
        .onChange(of: path) { _, newValue in
            // Popped back to the list -> refresh so edits/deletes show through.
            if newValue.isEmpty { Task { await fetchEntries() } }
        }
    }

    // MARK: - Data

    private func fetchEntries() async {
        do {
            entries = try await api.fetchJournalEntries()
            errorText = nil
        } catch {
            errorText = error.localizedDescription
        }
        loading = false
    }

    private func createEntry() {
        Task {
            do {
                let created = try await api.createJournalEntry()
                await fetchEntries()
                path.append(created)
            } catch APIError.http(409, _) {
                // Today's entry already exists — open it instead.
                let today = Self.todayString()
                if let existing = entries.first(where: { $0.entryDate == today }) {
                    path.append(existing)
                }
            } catch {
                errorText = error.localizedDescription
            }
        }
    }

    private func handleDeleted(_ entry: JournalEntry) {
        entries.removeAll { $0.id == entry.id }
        if !path.isEmpty { path.removeLast() }
    }

    static func todayString() -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: Date())
    }
}

// MARK: - List row

private struct EntryRow: View {
    let entry: JournalEntry

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(Self.formatShort(entry.entryDate))
                    .font(FPFont.mono(10))
                    .tracking(1.8)
                    .foregroundColor(.fpAccent)
                if let title = entry.title, !title.isEmpty {
                    Text(title)
                        .font(FPFont.sans(15, .bold))
                        .foregroundColor(.ink)
                        .lineLimit(1)
                }
                if !entry.wins.isEmpty {
                    Text(entry.wins)
                        .font(FPFont.sans(13))
                        .foregroundColor(.ink3)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.ink3)
        }
        .padding(16)
        .cardSurface()
    }

    static func formatShort(_ iso: String) -> String {
        Self.dateFormatter("yyyy-MM-dd").date(from: iso).map {
            Self.dateFormatter("MMM d, yyyy").string(from: $0)
        } ?? iso
    }

    private static func dateFormatter(_ fmt: String) -> DateFormatter {
        let f = DateFormatter()
        f.dateFormat = fmt
        return f
    }
}

// MARK: - Detail / editor

private struct JournalDetailView: View {
    let entry: JournalEntry
    let onDeleted: () -> Void

    private let api = APIClient.shared

    @State private var draft: JournalEntry
    @State private var dirty = false
    @State private var saving = false
    @State private var confirmDelete = false
    @State private var errorText: String?

    @Environment(\.dismiss) private var dismiss

    init(entry: JournalEntry, onDeleted: @escaping () -> Void) {
        self.entry = entry
        self.onDeleted = onDeleted
        _draft = State(initialValue: entry)
    }

    var body: some View {
        ZStack {
            Color.fpBG.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text(Self.formatLong(draft.entryDate))
                        .font(FPFont.mono(11))
                        .tracking(2)
                        .foregroundColor(.fpAccent)
                        .padding(.bottom, 12)

                    TextField("Give this entry a title…", text: titleBinding)
                        .font(FPFont.display(24))
                        .foregroundColor(.ink)
                        .padding(.bottom, 18)

                    VStack(spacing: 14) {
                        JournalSection(
                            label: "Wins",
                            sublabel: "What went well today",
                            systemImage: "checkmark.seal",
                            text: winsBinding
                        )
                        JournalSection(
                            label: "Challenges",
                            sublabel: "What was tough or didn't go as planned",
                            systemImage: "exclamationmark.triangle",
                            text: challengesBinding
                        )
                        JournalSection(
                            label: "Tomorrow's Focus",
                            sublabel: "What to tackle next",
                            systemImage: "target",
                            text: tomorrowsFocusBinding
                        )
                    }

                    if let err = errorText {
                        Text(err)
                            .font(FPFont.mono(11))
                            .foregroundColor(.fpAccent)
                            .padding(.top, 12)
                    }

                    HStack(spacing: 12) {
                        Button {
                            Task { await save() }
                        } label: {
                            Text(saving ? "Saving…" : "Save")
                                .font(FPFont.mono(13, .bold))
                                .tracking(1)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 46)
                                .background(Color.fpAccent.opacity(saving ? 0.6 : 1))
                                .overlay(
                                    RoundedRectangle(cornerRadius: FPRadius.button)
                                        .stroke(Color.fpAccent, lineWidth: 1)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: FPRadius.button))
                        }
                        .buttonStyle(.plain)
                        .disabled(saving)

                        if !confirmDelete {
                            Button {
                                confirmDelete = true
                            } label: {
                                Text("Delete")
                                    .font(FPFont.mono(13))
                                    .tracking(1)
                                    .foregroundColor(.ink3)
                                    .frame(height: 46)
                                    .padding(.horizontal, 18)
                                    .background(Color.white.opacity(0.03))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: FPRadius.button)
                                            .stroke(Color.line, lineWidth: 1)
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: FPRadius.button))
                            }
                            .buttonStyle(.plain)
                        } else {
                            Button {
                                Task { await deleteEntry() }
                            } label: {
                                Text("Confirm Delete")
                                    .font(FPFont.mono(13))
                                    .tracking(1)
                                    .foregroundColor(.fpAccent)
                                    .frame(height: 46)
                                    .padding(.horizontal, 18)
                                    .background(Color.fpAccent.opacity(0.15))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: FPRadius.button)
                                            .stroke(Color.fpAccent, lineWidth: 1)
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: FPRadius.button))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.top, 22)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 40)
            }
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        // Fire-and-forget save when leaving with unsaved edits (matches web).
        .onDisappear {
            guard dirty, !saving else { return }
            let snapshot = draft
            Task { _ = try? await api.updateJournalEntry(
                id: snapshot.id,
                title: snapshot.title,
                wins: snapshot.wins,
                challenges: snapshot.challenges,
                tomorrowsFocus: snapshot.tomorrowsFocus
            ) }
        }
    }

    // MARK: - Bindings (set dirty on change)

    private var titleBinding: Binding<String> {
        Binding(
            get: { draft.title ?? "" },
            set: { v in draft.title = v.isEmpty ? nil : v; dirty = true }
        )
    }
    private var winsBinding: Binding<String> {
        Binding(get: { draft.wins }, set: { v in draft.wins = v; dirty = true })
    }
    private var challengesBinding: Binding<String> {
        Binding(get: { draft.challenges }, set: { v in draft.challenges = v; dirty = true })
    }
    private var tomorrowsFocusBinding: Binding<String> {
        Binding(get: { draft.tomorrowsFocus }, set: { v in draft.tomorrowsFocus = v; dirty = true })
    }

    // MARK: - Actions

    private func save() async {
        guard !saving else { return }
        saving = true
        defer { saving = false }
        do {
            let updated = try await api.updateJournalEntry(
                id: draft.id,
                title: draft.title,
                wins: draft.wins,
                challenges: draft.challenges,
                tomorrowsFocus: draft.tomorrowsFocus
            )
            draft = updated
            dirty = false
            errorText = nil
        } catch {
            errorText = error.localizedDescription
        }
    }

    private func deleteEntry() async {
        do {
            try await api.deleteJournalEntry(id: draft.id)
            onDeleted()
        } catch {
            errorText = error.localizedDescription
        }
    }

    static func formatLong(_ iso: String) -> String {
        Self.dateFormatter("yyyy-MM-dd").date(from: iso).map {
            Self.dateFormatter("EEEE, MMMM d, yyyy").string(from: $0)
        } ?? iso
    }

    private static func dateFormatter(_ fmt: String) -> DateFormatter {
        let f = DateFormatter()
        f.dateFormat = fmt
        return f
    }
}

// MARK: - Section card with multiline editor

private struct JournalSection: View {
    let label: String
    let sublabel: String
    let systemImage: String
    @Binding var text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: systemImage)
                    .font(.system(size: 15))
                    .foregroundColor(.fpAccent)
                Text(label.uppercased())
                    .font(FPFont.mono(11, .bold))
                    .tracking(1.8)
                    .foregroundColor(.ink)
            }
            Text(sublabel.uppercased())
                .font(FPFont.mono(9.5))
                .tracking(0.6)
                .foregroundColor(.ink3)

            TextEditor(text: $text)
                .scrollContentBackground(.hidden)
                .background(Color.white.opacity(0.02))
                .font(FPFont.sans(14))
                .foregroundColor(.ink)
                .frame(minHeight: 96)
                .padding(8)
                .overlay(
                    RoundedRectangle(cornerRadius: FPRadius.tile)
                        .stroke(Color.line, lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: FPRadius.tile))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardSurface()
    }
}

#Preview {
    JournalView()
        .preferredColorScheme(.dark)
}
