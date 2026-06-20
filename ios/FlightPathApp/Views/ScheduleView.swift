import SwiftUI

// MARK: - Static definitions

private struct MilestoneDefinition: Identifiable {
    let id: String      // "01"–"05"
    let title: String
    let category: String
    let tag: String
    let summary: String
    let isSystemDriven: Bool
}

private let kMilestones: [MilestoneDefinition] = [
    .init(id: "01", title: "Build Your 40-Day Calendar",
          category: "PLANNING", tag: "DAY 1",
          summary: "Map out your work days and hours for the next 40 days based on your availability. Lock in when you will and won't be knocking, from the jump.",
          isSystemDriven: false),
    .init(id: "02", title: "Door Pitch Certified",
          category: "ONBOARDING", tag: "48 HOURS",
          summary: "Learn the Door Pitch and get it approved by a manager within 48 hours of your start date.",
          isSystemDriven: false),
    .init(id: "03", title: "Knock With Leadership",
          category: "FIELD", tag: "WEEKS 1–2",
          summary: "Schedule and complete knock sessions with two different leaders in your first two weeks.",
          isSystemDriven: false),
    .init(id: "04", title: "Buddy Knock Challenge",
          category: "FIELD", tag: "FULL DAY",
          summary: "Spend a full day with a Flight Path graduate and land 3 appointments together. Fall short? Reschedule until you hit it.",
          isSystemDriven: false),
    .init(id: "05", title: "Graduate: 20 Sits in 40 Days",
          category: "GOAL", tag: "GRADUATION",
          summary: "Hit 20 sits within 40 days to earn your wings.",
          isSystemDriven: true),
]

private struct ResourceDefinition: Identifiable {
    let id: String
    let title: String
    let category: String
    let tag: String
}

private let kResources: [ResourceDefinition] = [
    .init(id: "schedule",  title: "Flight Path Schedule",           category: "ONBOARDING", tag: "WEEK 1"),
    .init(id: "doorpitch", title: "The Door Pitch",                 category: "SALES",      tag: "SCRIPT"),
    .init(id: "repcard",   title: "RepCard Territory Management",   category: "TOOLS",      tag: "DOOR TO DOOR"),
    .init(id: "reading",   title: "Recommended Reading & Content",  category: "RESOURCES",  tag: "LIBRARY"),
]

// MARK: - ViewModel

@MainActor
final class ScheduleViewModel: ObservableObject {
    @Published var progress: OnboardingProgress
    @Published var isLoading = false
    @Published var error: String?

    private let api = APIClient.shared

    init() {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
        progress = OnboardingProgress(
            startDate: f.string(from: Date()),
            sitsCompleted: 0,
            milestones: [:],
            fortyDayPlan: nil
        )
    }

    // ── Data loading ───────────────────────────────────────────────────

    func load() async {
        isLoading = true
        error = nil
        defer { isLoading = false }
        do {
            progress = try await api.fetchOnboardingProgress()
        } catch {
            self.error = "Couldn't load schedule — pull to retry."
        }
    }

    // ── Milestone actions ──────────────────────────────────────────────

    func checkMilestone(id: String, selfChecked: Bool) async {
        var s = progress.milestones[id] ?? .empty
        s.selfChecked = selfChecked
        progress.milestones[id] = s
        do {
            progress = try await api.updateMilestone(id: id, selfChecked: selfChecked)
        } catch {
            var s2 = progress.milestones[id] ?? .empty
            s2.selfChecked = !selfChecked
            progress.milestones[id] = s2
        }
    }

    func confirmMilestone(id: String, confirmed: Bool) async {
        var s = progress.milestones[id] ?? .empty
        if confirmed {
            s.confirmedByManager = true
            s.revokedByManager = false
        } else {
            s.confirmedByManager = false
            s.revokedByManager = true
            s.selfChecked = false
        }
        progress.milestones[id] = s
        // TODO: manager confirm/revoke endpoint when backend is ready
    }

    func incrementSubline(id: String, delta: Int) async {
        var s = progress.milestones[id] ?? .empty
        s.sublineValue = max(0, (s.sublineValue ?? 0) + delta)
        progress.milestones[id] = s
        // TODO: persist subline value to backend
    }

    func submitFortyDayPlan(_ plan: FortyDayPlan) async {
        progress.fortyDayPlan = plan
        var s = progress.milestones["01"] ?? .empty
        s.selfChecked = true
        progress.milestones["01"] = s
        do {
            progress = try await api.updateFortyDayPlan(plan)
        } catch {
            // keep optimistic state; will re-sync on next load
        }
    }

    // ── Computed helpers ───────────────────────────────────────────────

    func state(for id: String) -> MilestoneState {
        progress.milestones[id] ?? .empty
    }

    func isCompleted(_ id: String) -> Bool {
        if id == "05" { return progress.sitsCompleted >= 20 }
        let s = state(for: id)
        return (s.selfChecked || s.confirmedByManager) && !s.revokedByManager
    }

    var isGraduated: Bool { progress.sitsCompleted >= 20 }

    var sitsProgress: CGFloat {
        min(1, CGFloat(progress.sitsCompleted) / 20)
    }

    var dayNumber: Int {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.timeZone = .current
        guard let start = f.date(from: progress.startDate) else { return 1 }
        let cal = Calendar.current
        let d = cal.dateComponents([.day],
            from: cal.startOfDay(for: start),
            to: cal.startOfDay(for: Date())).day ?? 0
        return min(40, max(1, d + 1))
    }
}

// MARK: - ScheduleView

struct ScheduleView: View {
    @EnvironmentObject var app: AppState
    @StateObject private var vm = ScheduleViewModel()
    @State private var selectedMilestone: MilestoneDefinition?
    @State private var selectedResource: ResourceDefinition?

    private var isManager: Bool {
        app.user?.role == "manager" || app.user?.role == "admin"
    }

    var body: some View {
        ZStack {
            ViewBackground(imageName: "ScheduleBG")

            if vm.isLoading && vm.progress.milestones.isEmpty {
                VStack(spacing: 14) {
                    ProgressView().tint(.fpAccent2)
                    Text("LOADING SCHEDULE")
                        .font(FPFont.mono(10)).tracking(2.4).foregroundColor(.ink3)
                }
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        pageHeader
                        if let err = vm.error {
                            Text(err)
                                .font(FPFont.mono(10)).foregroundColor(.fpAccent)
                                .padding(.bottom, 12)
                        }
                        GoalBanner(vm: vm).padding(.bottom, 28)
                        sectionLabel("MILESTONES").padding(.bottom, 12)
                        VStack(spacing: 10) {
                            ForEach(kMilestones) { def in
                                MilestoneCard(def: def, vm: vm) {
                                    selectedMilestone = def
                                }
                            }
                        }
                        .padding(.bottom, 28)
                        sectionLabel("RESOURCES").padding(.bottom, 12)
                        VStack(spacing: 10) {
                            ForEach(kResources) { res in
                                ResourceRow(resource: res) { selectedResource = res }
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 22)
                    .padding(.bottom, 30)
                }
                .refreshable { await vm.load() }
            }
        }
        .task { await vm.load() }
        .sheet(item: $selectedMilestone) { def in
            MilestoneDetailSheet(def: def, vm: vm, isManager: isManager)
        }
        .sheet(item: $selectedResource) { res in
            ResourceDetailSheet(resource: res)
        }
    }

    private var pageHeader: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("FLIGHT PATH PROGRAM")
                .font(FPFont.mono(10)).tracking(3.4).foregroundColor(.ink3)
            Text("SCHEDULE")
                .font(FPFont.display(38)).foregroundColor(.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, 20)
    }

    private func sectionLabel(_ text: String) -> some View {
        Text(text)
            .font(FPFont.mono(10, .bold)).tracking(3.0).foregroundColor(.ink3)
    }
}

// MARK: - GoalBanner

private struct GoalBanner: View {
    @ObservedObject var vm: ScheduleViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(vm.isGraduated ? "MISSION COMPLETE" : "YOUR MISSION")
                .font(FPFont.mono(9)).tracking(2.8)
                .foregroundColor(vm.isGraduated ? .fpSuccess : .fpAccent2)
                .padding(.bottom, 6)

            Text("20 SITS\nIN 40 DAYS")
                .font(FPFont.display(44)).foregroundColor(.ink).lineSpacing(2)

            Text("Your mission to graduate Flight Path.")
                .font(FPFont.mono(11)).foregroundColor(.ink2)
                .padding(.top, 8).padding(.bottom, 16)

            BannerProgressBar(progress: vm.sitsProgress, graduated: vm.isGraduated)
                .padding(.bottom, 10)

            HStack {
                if vm.isGraduated {
                    Label {
                        Text("WINGS EARNED")
                            .font(FPFont.mono(10, .bold)).tracking(1.8)
                    } icon: {
                        Image(systemName: "checkmark.seal.fill")
                    }
                    .foregroundColor(.fpSuccess)
                } else {
                    Text("\(vm.progress.sitsCompleted) / 20 SITS")
                        .font(FPFont.mono(10, .bold)).tracking(1.4).foregroundColor(.ink2)
                }
                Spacer()
                Text("DAY \(vm.dayNumber) OF 40")
                    .font(FPFont.mono(10)).tracking(1.4).foregroundColor(.ink3)
            }
        }
        .padding(20)
        .background {
            if vm.isGraduated { Color.fpSuccess.opacity(0.08) }
            else { Color.fpAccent.opacity(0.06) }
        }
        .overlay(
            RoundedRectangle(cornerRadius: FPRadius.cardLg)
                .stroke(vm.isGraduated ? Color.fpSuccess.opacity(0.40) : Color.fpAccent.opacity(0.28), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: FPRadius.cardLg))
    }
}

private struct BannerProgressBar: View {
    let progress: CGFloat
    let graduated: Bool

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.10))
                if graduated {
                    Capsule().fill(Color.fpSuccess)
                        .frame(width: max(0, geo.size.width * progress))
                } else {
                    Capsule()
                        .fill(LinearGradient(colors: [.fpAccent, .fpAccent2],
                                             startPoint: .leading, endPoint: .trailing))
                        .frame(width: max(0, geo.size.width * progress))
                }
            }
        }
        .frame(height: 6)
        .animation(.easeOut(duration: 0.5), value: progress)
    }
}

// MARK: - CompletionDot

struct CompletionDot: View {
    let completed: Bool

    var body: some View {
        Circle()
            .fill(completed ? Color.fpSuccess : Color.fpSuccessDim)
            .overlay(Circle().stroke(completed ? Color.fpSuccess.opacity(0.6) : Color.line, lineWidth: 1))
            .shadow(color: completed ? Color.fpSuccess.opacity(0.45) : .clear, radius: 5)
            .frame(width: 14, height: 14)
            .animation(.easeInOut(duration: 0.3), value: completed)
    }
}

// MARK: - MilestoneCard

private struct MilestoneCard: View {
    let def: MilestoneDefinition
    @ObservedObject var vm: ScheduleViewModel
    let onTap: () -> Void

    private var state: MilestoneState { vm.state(for: def.id) }
    private var completed: Bool { vm.isCompleted(def.id) }

    private var subline: String {
        switch def.id {
        case "01": return state.selfChecked ? "Plan submitted" : "Not yet planned"
        case "02":
            if completed { return "Certified" }
            return countdown48(from: vm.progress.startDate)
        case "03":
            let n = state.sublineValue ?? 0; return "\(n) / 2 sessions logged"
        case "04":
            let n = state.sublineValue ?? 0; return "Best attempt: \(n) / 3 appts"
        case "05":
            return "\(vm.progress.sitsCompleted) / 20 sits"
        default: return ""
        }
    }

    var body: some View {
        Button(action: onTap) {
            HStack(alignment: .top, spacing: 14) {
                Text(def.id)
                    .font(FPFont.mono(11, .bold)).foregroundColor(.fpAccent2)
                    .frame(width: 24, alignment: .leading).padding(.top, 2)

                VStack(alignment: .leading, spacing: 4) {
                    Text(def.title)
                        .font(FPFont.sans(14.5, .bold)).foregroundColor(.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    Text("\(def.category) · \(def.tag)")
                        .font(FPFont.mono(10)).tracking(1.2).foregroundColor(.ink3)
                    Text(def.summary)
                        .font(FPFont.mono(10.5)).foregroundColor(.ink3)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, 4).lineSpacing(2)
                    if !subline.isEmpty {
                        Text(subline.uppercased())
                            .font(FPFont.mono(9.5, .bold)).tracking(1.0)
                            .foregroundColor(completed ? .fpSuccess : .fpAccent2)
                            .padding(.top, 2)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                VStack(alignment: .trailing, spacing: 4) {
                    CompletionDot(completed: completed)
                    if state.confirmedByManager && !state.revokedByManager {
                        Text("MGR ✓")
                            .font(FPFont.mono(7.5, .bold)).tracking(0.6)
                            .foregroundColor(.fpSuccess)
                    }
                }
                .padding(.top, 2)
            }
            .padding(.horizontal, 16).padding(.vertical, 15)
            .cardSurface()
            .contentShape(RoundedRectangle(cornerRadius: FPRadius.card))
        }
        .buttonStyle(.plain)
    }

    private func countdown48(from dateStr: String) -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.timeZone = .current
        guard let start = f.date(from: dateStr) else { return "48h window" }
        let deadline = start.addingTimeInterval(48 * 3600)
        guard Date() < deadline else { return "48h window expired" }
        let rem = deadline.timeIntervalSince(Date())
        return "\(Int(rem / 3600))h \(Int(rem.truncatingRemainder(dividingBy: 3600) / 60))m left"
    }
}

// MARK: - ResourceRow

private struct ResourceRow: View {
    let resource: ResourceDefinition
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(resource.title)
                        .font(FPFont.sans(14.5, .bold)).foregroundColor(.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    Text("\(resource.category) · \(resource.tag)")
                        .font(FPFont.mono(10)).tracking(1.2).foregroundColor(.ink3)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "chevron.right")
                    .font(.system(size: 15, weight: .semibold)).foregroundColor(.ink3)
            }
            .padding(.horizontal, 16).padding(.vertical, 15)
            .cardSurface()
            .contentShape(RoundedRectangle(cornerRadius: FPRadius.card))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - MilestoneDetailSheet

struct MilestoneDetailSheet: View {
    let def: MilestoneDefinition
    @ObservedObject var vm: ScheduleViewModel
    let isManager: Bool

    @State private var showCalendarPlanner = false
    @Environment(\.dismiss) private var dismiss

    private var state: MilestoneState { vm.state(for: def.id) }
    private var completed: Bool { vm.isCompleted(def.id) }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.fpBG.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        sheetHeader
                        statusRow
                        milestoneContent
                        Divider().background(Color.line)
                        if !def.isSystemDriven { repActions }
                        if isManager { managerActions }
                    }
                    .padding(20).padding(.bottom, 40)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("MILESTONE \(def.id)")
                        .font(FPFont.mono(12, .bold)).tracking(2.4).foregroundColor(.ink)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(FPFont.mono(11, .bold)).foregroundColor(.fpAccent2)
                }
            }
        }
        .sheet(isPresented: $showCalendarPlanner) {
            CalendarPlannerView(
                startDate: vm.progress.startDate,
                existingPlan: vm.progress.fortyDayPlan
            ) { plan in Task { await vm.submitFortyDayPlan(plan) } }
        }
    }

    private var sheetHeader: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("\(def.category) · \(def.tag)")
                .font(FPFont.mono(10)).tracking(2.0).foregroundColor(.fpAccent2)
            Text(def.title.uppercased())
                .font(FPFont.display(30)).foregroundColor(.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(def.summary)
                .font(FPFont.mono(11.5)).foregroundColor(.ink2)
                .fixedSize(horizontal: false, vertical: true).lineSpacing(3)
                .padding(.top, 4)
        }
    }

    private var statusRow: some View {
        HStack(spacing: 10) {
            CompletionDot(completed: completed)
            Text(completed ? "COMPLETE" : "INCOMPLETE")
                .font(FPFont.mono(10, .bold)).tracking(1.8)
                .foregroundColor(completed ? .fpSuccess : .ink3)
            if state.confirmedByManager && !state.revokedByManager {
                Text("· MGR ✓")
                    .font(FPFont.mono(10, .bold)).tracking(1.8).foregroundColor(.fpSuccess)
            }
        }
    }

    @ViewBuilder
    private var milestoneContent: some View {
        switch def.id {
        case "01":
            Button("Open Calendar Planner  →") { showCalendarPlanner = true }
                .font(FPFont.mono(12, .bold)).tracking(1.2).foregroundColor(.fpAccent2)

        case "02":
            if !completed {
                let cd = countdown48(from: vm.progress.startDate)
                VStack(alignment: .leading, spacing: 6) {
                    Text("48-HOUR WINDOW")
                        .font(FPFont.mono(9, .bold)).tracking(2.0).foregroundColor(.ink3)
                    Text(cd)
                        .font(FPFont.display(28))
                        .foregroundColor(cd.contains("expired") ? .fpAccent : .ink)
                }
                .padding(14).cardSurface()
            }

        case "03":
            sessionCounter(label: "KNOCK SESSIONS LOGGED", value: state.sublineValue ?? 0,
                           goal: 2, milestoneId: "03", buttonLabel: "+1 SESSION")

        case "04":
            VStack(alignment: .leading, spacing: 8) {
                sessionCounter(label: "APPOINTMENTS THIS DAY", value: state.sublineValue ?? 0,
                               goal: 3, milestoneId: "04", buttonLabel: "+1 APPT")
                Text("Fall short of 3? Reschedule another full day.")
                    .font(FPFont.mono(10)).foregroundColor(.ink3)
                    .fixedSize(horizontal: false, vertical: true)
            }

        case "05":
            VStack(alignment: .leading, spacing: 6) {
                Text("READ-ONLY · SYSTEM-DRIVEN")
                    .font(FPFont.mono(9)).tracking(2.0).foregroundColor(.ink3)
                Text("Auto-completes when you reach 20 sits. No action needed.")
                    .font(FPFont.mono(11)).foregroundColor(.ink2)
            }
            .padding(14).cardSurface()

        default: EmptyView()
        }
    }

    private func sessionCounter(label: String, value: Int, goal: Int,
                                milestoneId: String, buttonLabel: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(label)
                .font(FPFont.mono(9, .bold)).tracking(2.0).foregroundColor(.ink3)
            HStack(spacing: 14) {
                HStack(alignment: .lastTextBaseline, spacing: 8) {
                    Text("\(value)").font(FPFont.display(48)).foregroundColor(.ink)
                    Text("/ \(goal)").font(FPFont.mono(13)).foregroundColor(.ink3)
                }
                Spacer()
                HStack(spacing: 8) {
                    CounterButton(title: "−") {
                        Task { await vm.incrementSubline(id: milestoneId, delta: -1) }
                    }
                    CounterButton(title: buttonLabel, primary: true) {
                        Task { await vm.incrementSubline(id: milestoneId, delta: 1) }
                    }
                }
                .frame(maxWidth: 180)
            }
        }
        .padding(14).cardSurface()
    }

    @ViewBuilder
    private var repActions: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("YOUR SIGN-OFF")
                .font(FPFont.mono(9, .bold)).tracking(2.0).foregroundColor(.ink3)
            if completed && state.selfChecked {
                CounterButton(title: "MARK INCOMPLETE") {
                    Task { await vm.checkMilestone(id: def.id, selfChecked: false) }
                }
            } else if !completed {
                let label = def.id == "01" ? "MARK PLAN SUBMITTED" : "MARK DONE"
                CounterButton(title: label, primary: true) {
                    Task { await vm.checkMilestone(id: def.id, selfChecked: true) }
                }
            }
        }
    }

    @ViewBuilder
    private var managerActions: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("MANAGER OVERRIDE")
                .font(FPFont.mono(9, .bold)).tracking(2.0).foregroundColor(.fpAccent2)
            HStack(spacing: 8) {
                CounterButton(title: "CONFIRM", primary: state.confirmedByManager && !state.revokedByManager) {
                    Task { await vm.confirmMilestone(id: def.id, confirmed: true) }
                }
                CounterButton(title: "REVOKE") {
                    Task { await vm.confirmMilestone(id: def.id, confirmed: false) }
                }
            }
        }
        .padding(14)
        .overlay(RoundedRectangle(cornerRadius: FPRadius.card).stroke(Color.fpAccent2.opacity(0.3), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: FPRadius.card))
    }

    private func countdown48(from dateStr: String) -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.timeZone = .current
        guard let start = f.date(from: dateStr) else { return "48h window" }
        let deadline = start.addingTimeInterval(48 * 3600)
        guard Date() < deadline else { return "Window expired" }
        let rem = deadline.timeIntervalSince(Date())
        return "\(Int(rem / 3600))h \(Int(rem.truncatingRemainder(dividingBy: 3600) / 60))m left"
    }
}

// MARK: - ResourceDetailSheet

private struct ResourceDetailSheet: View {
    let resource: ResourceDefinition
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        if resource.id == "doorpitch" {
            DoorPitchView()
        } else {
            NavigationStack {
                ZStack {
                    Color.fpBG.ignoresSafeArea()
                    VStack(spacing: 16) {
                        Spacer()
                        Text(resource.title.uppercased())
                            .font(FPFont.display(30)).foregroundColor(.ink)
                            .multilineTextAlignment(.center).padding(.horizontal, 24)
                        Text("\(resource.category) · \(resource.tag)")
                            .font(FPFont.mono(10)).tracking(1.8).foregroundColor(.ink3)
                        Text("Notion page renderer — coming soon.")
                            .font(FPFont.mono(11)).foregroundColor(.ink3)
                            .padding(.top, 6)
                        Spacer()
                    }
                }
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Done") { dismiss() }
                            .font(FPFont.mono(11, .bold)).foregroundColor(.fpAccent2)
                    }
                }
            }
        }
    }
}

// MARK: - CalendarPlannerView

struct CalendarPlannerView: View {
    let startDate: String
    let existingPlan: FortyDayPlan?
    let onSubmit: (FortyDayPlan) -> Void

    @State private var days: [WorkDay] = []
    @Environment(\.dismiss) private var dismiss

    private var workingDays: Int { days.filter(\.isWorking).count }
    private var totalHours: Int {
        days.filter(\.isWorking).reduce(0) { acc, d in
            acc + max(0, (d.endHour ?? 20) - (d.startHour ?? 16))
        }
    }
    private var sitsPace: String {
        guard workingDays > 0 else { return "—" }
        let est = workingDays / 2
        return est >= 20 ? "On track ✓" : "~\(est) sits"
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.fpBG.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        quickPickRow
                        rollupCard
                        VStack(spacing: 8) {
                            ForEach($days) { $day in
                                DayPlanRow(day: $day, displayDate: displayDate(day.date))
                            }
                        }
                        // TODO: PDF / Word export via UIActivityViewController + PDFKit
                        Text("// TODO: PDF / Word export")
                            .font(FPFont.mono(10)).foregroundColor(.ink3)
                    }
                    .padding(.horizontal, 20).padding(.top, 14).padding(.bottom, 40)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("40-DAY CALENDAR")
                        .font(FPFont.mono(12, .bold)).tracking(2.4).foregroundColor(.ink)
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .font(FPFont.mono(11)).foregroundColor(.ink3)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Submit") {
                        onSubmit(FortyDayPlan(days: days, submitted: true))
                        dismiss()
                    }
                    .font(FPFont.mono(11, .bold)).foregroundColor(.fpAccent2)
                }
            }
        }
        .onAppear { buildDays() }
    }

    private var quickPickRow: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("QUICK-FILL WORKING DAYS")
                .font(FPFont.mono(9, .bold)).tracking(2.0).foregroundColor(.ink3)
            HStack(spacing: 8) {
                quickPickButton("Weekday 4–8pm") { applyQuickPick(weekend: false, s: 16, e: 20) }
                quickPickButton("Weekend 10am–4pm") { applyQuickPick(weekend: true,  s: 10, e: 16) }
                quickPickButton("Clear All", accent: true) { days = days.map { var d = $0; d.isWorking = false; return d } }
            }
        }
        .padding(14).cardSurface()
    }

    private func quickPickButton(_ label: String, accent: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(FPFont.mono(10, .bold)).tracking(0.3)
                .foregroundColor(accent ? .fpAccent : .ink2)
                .padding(.horizontal, 10).padding(.vertical, 6)
                .background(Color.white.opacity(0.04))
                .overlay(Capsule().stroke(accent ? Color.fpAccent.opacity(0.4) : Color.line, lineWidth: 1))
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    private var rollupCard: some View {
        HStack(spacing: 0) {
            rollupStat("WORKING DAYS", "\(workingDays)")
            Color.line.frame(width: 1, height: 36)
            rollupStat("TOTAL HOURS", "\(totalHours)")
            Color.line.frame(width: 1, height: 36)
            rollupStat("SITS PACE", sitsPace)
        }
        .padding(.vertical, 14).cardSurface()
    }

    private func rollupStat(_ label: String, _ value: String) -> some View {
        VStack(spacing: 4) {
            Text(value).font(FPFont.display(22)).foregroundColor(.ink)
            Text(label).font(FPFont.mono(8)).tracking(1.2).foregroundColor(.ink3)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }

    private func buildDays() {
        if let plan = existingPlan, !plan.days.isEmpty { days = plan.days; return }
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.timeZone = .current
        let start = f.date(from: startDate) ?? Date()
        let cal = Calendar.current
        days = (0..<40).compactMap { i in
            guard let date = cal.date(byAdding: .day, value: i, to: start) else { return nil }
            let wd = cal.component(.weekday, from: date)
            let isWknd = wd == 1 || wd == 7
            return WorkDay(date: f.string(from: date),
                           isWorking: !isWknd,
                           startHour: isWknd ? 10 : 16,
                           endHour:   isWknd ? 16 : 20)
        }
    }

    private func applyQuickPick(weekend: Bool, s: Int, e: Int) {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.timeZone = .current
        days = days.map { day in
            guard let d = f.date(from: day.date) else { return day }
            let wd = Calendar.current.component(.weekday, from: d)
            let isWknd = wd == 1 || wd == 7
            guard isWknd == weekend else { return day }
            var d2 = day; d2.isWorking = true; d2.startHour = s; d2.endHour = e
            return d2
        }
    }

    private func displayDate(_ dateStr: String) -> String {
        let fi = DateFormatter(); fi.dateFormat = "yyyy-MM-dd"; fi.timeZone = .current
        let fo = DateFormatter(); fo.dateFormat = "EEE, MMM d"
        guard let d = fi.date(from: dateStr) else { return dateStr }
        return fo.string(from: d)
    }
}

// MARK: - DayPlanRow

private struct DayPlanRow: View {
    @Binding var day: WorkDay
    let displayDate: String

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Toggle(isOn: $day.isWorking) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(displayDate)
                            .font(FPFont.sans(13, .semibold))
                            .foregroundColor(day.isWorking ? .ink : .ink3)
                        Text(day.isWorking ? "WORKING" : "OFF")
                            .font(FPFont.mono(9)).tracking(1.2)
                            .foregroundColor(day.isWorking ? .fpAccent2 : .ink3)
                    }
                }
                .toggleStyle(SwitchToggleStyle(tint: .fpAccent))
            }
            .padding(.horizontal, 14).padding(.vertical, 10)

            if day.isWorking {
                Color.line.frame(height: 1).padding(.horizontal, 14)
                HStack(spacing: 16) {
                    HourControl(label: "FROM",
                                hour: Binding(get: { day.startHour ?? 16 },
                                              set: { day.startHour = $0 }))
                    HourControl(label: "TO",
                                hour: Binding(get: { day.endHour ?? 20 },
                                              set: { day.endHour = $0 }))
                    Spacer()
                    let hrs = max(0, (day.endHour ?? 20) - (day.startHour ?? 16))
                    Text("\(hrs)h")
                        .font(FPFont.mono(11, .bold)).foregroundColor(.ink2)
                }
                .padding(.horizontal, 14).padding(.vertical, 10)
            }
        }
        .cardSurface()
    }
}

private struct HourControl: View {
    let label: String
    @Binding var hour: Int

    private func fmt(_ h: Int) -> String {
        let h2 = max(0, min(23, h))
        let suffix = h2 >= 12 ? "PM" : "AM"
        let disp = h2 == 0 ? 12 : h2 > 12 ? h2 - 12 : h2
        return "\(disp)\(suffix)"
    }

    var body: some View {
        HStack(spacing: 6) {
            Text(label)
                .font(FPFont.mono(9)).tracking(1.4).foregroundColor(.ink3)
            Text(fmt(hour))
                .font(FPFont.mono(11, .bold)).foregroundColor(.ink)
                .frame(width: 46, alignment: .leading)
            Stepper("", value: $hour, in: 0...23)
                .labelsHidden()
                .tint(.fpAccent2)
        }
    }
}
