import SwiftUI

// MARK: - Door Pitch — Field Script & Tonality System

struct DoorPitchView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color.fpBG.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 44) {
                        heroHeader
                        tonalitySection
                        keywordSection
                        readingSection
                        sequenceSection
                        flowSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                    .padding(.bottom, 60)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("DOOR PITCH")
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
    }

    // MARK: - Hero

    private var heroHeader: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("THE FIELD SCRIPT & TONALITY SYSTEM")
                .font(FPFont.mono(9.5))
                .tracking(2.8)
                .foregroundColor(.ink3)
            Text("DOOR\nPITCH")
                .font(FPFont.display(58))
                .foregroundColor(.ink)
        }
        .padding(.top, 4)
    }

    // MARK: - 01 Tonality Directory

    private var tonalitySection: some View {
        VStack(alignment: .leading, spacing: 14) {
            PitchSectionHeader(
                kicker: "01 — Tonality Directory",
                title: "Inflection Direction",
                lead: "Reference this key when writing or reading pitch lines. The arrow tells your voice where to go."
            )
            VStack(spacing: 0) {
                TonalityRow(arrow: "↗️", inflection: "Rising (Upper)",
                            description: "Voice goes UP at the end — sounds like a question, curious, inviting")
                Color.line.frame(height: 1).padding(.horizontal, 16)
                TonalityRow(arrow: "↘️", inflection: "Falling (Lower)",
                            description: "Voice goes DOWN at the end — sounds certain, confident, authoritative")
                Color.line.frame(height: 1).padding(.horizontal, 16)
                TonalityRow(arrow: "➡️", inflection: "Flat / Neutral",
                            description: "Steady tone — casual, conversational, no pressure")
            }
            .cardSurface()
        }
    }

    // MARK: - Keyword Tags

    private let keywords: [KeywordItem] = [
        .init("CURIOUS",  "Genuine interest, asking-not-telling",               "Opening questions, rapport builders"),
        .init("CERTAIN",  "Authority, matter-of-fact",                           "Social proof, stating results, facts"),
        .init("SOFT",     "Gentle, low-key, disarming",                          "Lowering resistance, \"I'm not here to sell you\""),
        .init("PUNCH",    "Sharp emphasis on one key word",                       "Highlighting a number, name, or benefit"),
        .init("CASUAL",   "Laid-back, neighbor-to-neighbor",                      "Transitions, throwaway lines, keeping it human"),
        .init("URGENT",   "Time-sensitive, now-or-never",                         "Scarcity, deadlines, limited availability"),
        .init("WARM",     "Friendly, genuine, likable",                           "Compliments, thank-yous, positive reactions"),
        .init("CONFUSED", "Slightly puzzled, makes them want to explain",         "Pattern interrupts, reframes, takeaway closes"),
        .init("!",        "Affirmative agreement — pitch up one notch, head nodding yes.", "Reinforcing the homeowner's own logic back to them"),
    ]

    private var keywordSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            PitchSectionHeader(
                kicker: "Keyword Tags",
                title: "Delivery Vibe",
                lead: "The bracketed tag sets the energy of the line — how it should feel coming out of your mouth."
            )
            VStack(spacing: 0) {
                ForEach(keywords.indices, id: \.self) { i in
                    if i > 0 { Color.line.frame(height: 1).padding(.horizontal, 16) }
                    KeywordRow(item: keywords[i])
                }
            }
            .cardSurface()
        }
    }

    // MARK: - 02 Reading a Line

    private var readingSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            PitchSectionHeader(kicker: "02 — Reading a Line", title: "How to Read a Pitch Line")
            HStack(spacing: 8) {
                LegendCard(label: "Bold Word",     body: "The word you stress.")
                LegendCard(label: "Arrow Emoji",   body: "The direction your voice goes.")
                LegendCard(label: "Bracketed Tag", body: "The energy / vibe of the delivery.")
            }
            HStack(spacing: 0) {
                Rectangle().fill(Color.fpAccent).frame(width: 2)
                (Text("\"We just helped your ")
                    .font(FPFont.mono(13))
                    .foregroundColor(.ink2) +
                 Text("neighbor")
                    .font(FPFont.mono(13, .bold))
                    .foregroundColor(.ink) +
                 Text(" save about thirty percent.\" ↘️  ")
                    .font(FPFont.mono(13))
                    .foregroundColor(.ink2) +
                 Text("CERTAIN")
                    .font(FPFont.mono(11, .bold))
                    .foregroundColor(.fpAccent2))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
            }
            .cardSurface()
        }
    }

    // MARK: - 03 The Sequence

    private let pitchSteps: [PitchStep] = [
        .init(title: "Intro",
              script: "[WARM] + [CASUAL] Hi there, glad I caught you today. My name is \"Your First Name\" with SunRite out of Hudson, MA. We're those professionals that go door-to-door, trying to find homeowners that just don't care for {name the utility} and their costs going up every few months and why they haven't done anything about it."),
        .init(title: "Offering",
              script: "[!] Yeah, for the solar panels. I'm sure you've heard about it over the years or even know some friends that have done it but every year the state and federal programs have gone through some recent changes and that's why we're out here and just met your neighbor (Enter Name Here) and wanted to stop by as it looks to be a good home as well. Have you ever had your home evaluated? Great — what did they tell you? And when was it evaluated? Ya it looks like you get a ton of sun. Is there any reason you didn't move forward?"),
        .init(title: "Overcoming Objection",
              script: "— To be scripted —"),
        .init(title: "Value",
              script: "[CERTAIN] Solar may save you money and that's great and all, but where the true value is in this is….it's a home improvement project that ensures you control your costs for \"DECADES\" and instead of sending your money to the utility it's being spent on your \"Home.\"",
              note: "Value section can be driven by discovery from the conversation if there are more valuable topics from the homeowner."),
        .init(title: "Curiosity + Takeaway",
              script: "\"Curiosity\" — There's also a chance this doesn't make sense of course. It doesn't for everyone.\n\n\"Takeaway\" — Like even if you find it logical, the house may not qualify and the utility may not qualify it.\n\n(If they ask about the utility approvals the response is: \"Great question, I'm not trained on that overall but I know it depends on how many panels and your transformer out on the street there (point).\")"),
        .init(title: "Lowering Buying Pressure + Close",
              script: "Let's do this, you seem to have a good level of interest. Our professionals are on (Name street) tonight and (name street) Tomorrow and I'll have them squeeze you in.\n\nIt's our own people just spending their time and in the end (pause)…….if it's \"LOGICAL\" you can pull the trigger and if not….no big deal. ↘️\n\nUpper inflection: \"Sound fair enough?\" ↗️"),
        .init(title: "Appointment Funneling",
              script: "Knocking Sat → Tuesday: \"Are you available afternoons or evenings?\"\n\n\"Tuesday Afternoon Scenario\" — I have tomorrow at 1pm and Thursday at 3pm. Which one works best for you?\n\n\"Tuesday Evening Scenario\" — I have tonight at 7pm and tomorrow at 5pm. Which one works best for you?\n\nKnocking Wednesday → Sat: \"Are you available evenings or weekends?\"\n\n\"Wednesday Evening Scenario\" — I have tonight at 7pm and tomorrow at 5pm. Which one works best for you?\n\n\"Wednesday Weekend Scenario\" — I have Saturday at 9am and Saturday at 11am. Which one works best for you?\n\n** If the times you offer do not work, do NOT fall for this common mistake: \"What works best for you then?\"\n** Instead, offer two different times based on their preference — but within 3 days."),
    ]

    private var sequenceSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            PitchSectionHeader(
                kicker: "03 — The Sequence",
                title: "Pitch Sections",
                lead: "Run the door top to bottom — each block flows into the next. Stress the bold words, ride the arrows, hold the tags."
            )
            ForEach(pitchSteps.indices, id: \.self) { i in
                PitchStepCard(number: i + 1, step: pitchSteps[i])
            }
        }
    }

    // MARK: - 04 Appointment Flow

    private let daySchedules: [DaySchedule] = [
        .init(day: "Mon", question: "Afternoon or Evenings?",
              opt1: "Afternoon", times1: [("12pm", "Tomorrow (Tue)"), ("1pm", "Wednesday")],
              opt2: "Evenings",  times2: [("6pm",  "Tonight"),        ("7pm", "Tomorrow")]),
        .init(day: "Tue", question: "Afternoon or Evenings?",
              opt1: "Afternoon", times1: [("12pm", "Tomorrow (Wed)"), ("1pm", "Thursday")],
              opt2: "Evenings",  times2: [("6pm",  "Tonight"),        ("7pm", "Tomorrow")]),
        .init(day: "Wed", question: "Afternoon or Evenings?",
              opt1: "Afternoon", times1: [("12pm", "Tomorrow"),       ("1pm", "Thursday")],
              opt2: "Evenings",  times2: [("6pm",  "Tonight"),        ("7pm", "Tomorrow")]),
        .init(day: "Thu", question: "Evenings or Weekends?",
              opt1: "Evenings",  times1: [("6pm",  "Tonight"),        ("7pm", "Tomorrow")],
              opt2: "Weekends",  times2: [("9am",  "Saturday"),       ("1pm", "Saturday")]),
        .init(day: "Fri", question: "Evenings or Weekends?",
              opt1: "Evenings",  times1: [("6pm",  "Tonight"),        ("7pm", "Monday")],
              opt2: "Weekends",  times2: [("9am",  "Saturday"),       ("1pm", "Saturday")]),
        .init(day: "Sat", question: "Afternoon or Evenings?",
              opt1: "Afternoon", times1: [("12pm", "Monday"),         ("1pm", "Tuesday")],
              opt2: "Evenings",  times2: [("6pm",  "Monday"),         ("7pm", "Tuesday")]),
        .init(day: "Sun", question: "Afternoon or Evenings?",
              opt1: "Afternoon", times1: [("12pm", "Monday"),         ("1pm", "Tuesday")],
              opt2: "Evenings",  times2: [("6pm",  "Monday"),         ("7pm", "Tuesday")]),
    ]

    private var flowSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            PitchSectionHeader(
                kicker: "04 — Appointment Flow",
                title: "Funneling Day-by-Day",
                lead: "Pick the day you're knocking, ask the funnel question, then offer the two set times. Always give a choice of two — never an open-ended \"what works for you?\""
            )
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(daySchedules) { schedule in
                    DayCard(schedule: schedule)
                }
            }
            GoldenRuleCard()
        }
    }
}

// MARK: - Data models (file-private)

private struct KeywordItem {
    let tag: String
    let energy: String
    let whenToUse: String
    init(_ tag: String, _ energy: String, _ whenToUse: String) {
        self.tag = tag; self.energy = energy; self.whenToUse = whenToUse
    }
}

private struct PitchStep {
    let title: String
    let script: String
    var note: String? = nil
}

private struct DaySchedule: Identifiable {
    let id = UUID()
    let day: String
    let question: String
    let opt1: String
    let times1: [(String, String)]
    let opt2: String
    let times2: [(String, String)]
}

// MARK: - Sub-views (file-private)

private struct PitchSectionHeader: View {
    let kicker: String
    let title: String
    var lead: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(kicker.uppercased())
                .font(FPFont.mono(10))
                .tracking(3.0)
                .foregroundColor(.fpAccent2)
            Text(title.uppercased())
                .font(FPFont.display(32))
                .foregroundColor(.ink)
            if let lead {
                Text(lead)
                    .font(FPFont.mono(11))
                    .foregroundColor(.ink3)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 2)
            }
        }
    }
}

private struct TonalityRow: View {
    let arrow: String
    let inflection: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text(arrow)
                .font(.system(size: 20))
                .frame(width: 34, alignment: .center)
            Text(inflection)
                .font(FPFont.sans(13, .bold))
                .foregroundColor(.ink)
                .frame(width: 108, alignment: .leading)
            Text(description)
                .font(FPFont.mono(11))
                .foregroundColor(.ink2)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }
}

private struct KeywordRow: View {
    let item: KeywordItem

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text(item.tag)
                .font(FPFont.mono(10, .bold))
                .tracking(0.6)
                .foregroundColor(.fpAccent2)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Color.fpAccent.opacity(0.10))
                .overlay(Capsule().stroke(Color.fpAccent.opacity(0.35), lineWidth: 1))
                .clipShape(Capsule())
                .fixedSize()
            VStack(alignment: .leading, spacing: 3) {
                Text(item.energy)
                    .font(FPFont.sans(13, .semibold))
                    .foregroundColor(.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text(item.whenToUse)
                    .font(FPFont.mono(10))
                    .foregroundColor(.ink3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}

private struct LegendCard: View {
    let label: String
    let body: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label.uppercased())
                .font(FPFont.mono(9, .bold))
                .tracking(1.4)
                .foregroundColor(.fpAccent2)
            Text(body)
                .font(FPFont.sans(12, .medium))
                .foregroundColor(.ink2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .cardSurface()
    }
}

private struct PitchStepCard: View {
    let number: Int
    let step: PitchStep

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Text(String(format: "%02d", number))
                    .font(FPFont.mono(10, .bold))
                    .tracking(1.2)
                    .foregroundColor(.fpAccent2)
                Text(step.title.uppercased())
                    .font(FPFont.display(22))
                    .foregroundColor(.ink)
            }
            Text(step.script)
                .font(FPFont.mono(13))
                .foregroundColor(.ink2)
                .fixedSize(horizontal: false, vertical: true)
                .lineSpacing(4)
            if let note = step.note {
                HStack(alignment: .top, spacing: 8) {
                    Rectangle().fill(Color.ink3.opacity(0.4)).frame(width: 2)
                    Text(note)
                        .font(FPFont.mono(11))
                        .foregroundColor(.ink3)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.top, 2)
            }
        }
        .padding(18)
        .cardSurface()
    }
}

private struct DayCard: View {
    let schedule: DaySchedule

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(schedule.day.uppercased())
                    .font(FPFont.display(24))
                    .foregroundColor(.ink)
                Spacer(minLength: 0)
            }
            Text(schedule.question)
                .font(FPFont.mono(9))
                .tracking(0.4)
                .foregroundColor(.ink3)
                .fixedSize(horizontal: false, vertical: true)
            branchView(label: schedule.opt1, times: schedule.times1)
            branchView(label: schedule.opt2, times: schedule.times2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .cardSurface()
    }

    @ViewBuilder
    private func branchView(label: String, times: [(String, String)]) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 4) {
                Circle().fill(Color.fpAccent2).frame(width: 5, height: 5)
                Text(label.uppercased())
                    .font(FPFont.mono(8.5, .bold))
                    .tracking(0.8)
                    .foregroundColor(.fpAccent2)
            }
            HStack(spacing: 6) {
                ForEach(times.indices, id: \.self) { i in
                    if i > 0 {
                        Text("or")
                            .font(FPFont.mono(8.5))
                            .foregroundColor(.ink3)
                    }
                    VStack(spacing: 1) {
                        Text(times[i].0)
                            .font(FPFont.sans(13, .bold))
                            .foregroundColor(.ink)
                        Text(times[i].1)
                            .font(FPFont.mono(8))
                            .foregroundColor(.ink3)
                    }
                }
            }
        }
    }
}

private struct GoldenRuleCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("THE GOLDEN RULE")
                .font(FPFont.mono(10, .bold))
                .tracking(2.0)
                .foregroundColor(.fpAccent2)

            HStack(spacing: 6) {
                RuleStep(num: "1", title: "Offer two specific times")
                Image(systemName: "arrow.right")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.ink3)
                RuleStep(num: "2", title: "Do they work?")
                Image(systemName: "arrow.right")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.ink3)
                RuleStep(num: "✓", title: "Lock it in", highlighted: true)
            }

            HStack(alignment: .top, spacing: 10) {
                Text("If No ↺")
                    .font(FPFont.mono(10, .bold))
                    .foregroundColor(.fpAccent)
                    .fixedSize()
                Text("NEVER ask \"What works best for you then?\" — offer TWO new times based on their preference, within 3 days, then loop back to Step 2.")
                    .font(FPFont.mono(11))
                    .foregroundColor(.ink2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(12)
            .background(Color.fpAccent.opacity(0.07))
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.fpAccent.opacity(0.28), lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .padding(18)
        .background(Color.card)
        .overlay(
            RoundedRectangle(cornerRadius: FPRadius.card)
                .stroke(Color.fpAccent.opacity(0.55), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: FPRadius.card))
    }
}

private struct RuleStep: View {
    let num: String
    let title: String
    var highlighted = false

    var body: some View {
        VStack(spacing: 5) {
            Text(num)
                .font(FPFont.mono(10, .bold))
                .foregroundColor(highlighted ? .white : .fpAccent2)
                .frame(width: 24, height: 24)
                .background(highlighted ? Color.fpAccent : Color.fpAccent.opacity(0.12))
                .clipShape(Circle())
            Text(title)
                .font(FPFont.mono(8.5))
                .foregroundColor(highlighted ? .ink : .ink2)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
    }
}
