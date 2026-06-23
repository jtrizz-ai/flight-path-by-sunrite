import SwiftUI

// MARK: - Levels — Field Team rank system (mirrors the Levels web design)
//
// Replicates levels.html: hero wordmark + cloud band, "The Climb" intro,
// three earned tiers with embroidered badge art, an at-a-glance matrix, and a
// live earnings calculator (tier is set by closed contracts; pay is per watt).

struct LevelsView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color.fpBG.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        hero
                        climbSection
                        tiersSection
                        matrixSection
                        LevelsCalculator()
                        footer
                    }
                    .padding(.bottom, 50)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("LEVELS")
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

    private var hero: some View {
        ZStack {
            // Planet glow (mirrors .planet-lg radial gradient)
            Circle()
                .fill(
                    RadialGradient(
                        gradient: Gradient(colors: [
                            Color(hex: "FFB089"), Color(hex: "F0673E"),
                            Color(hex: "C8331C"), Color(hex: "6F1A10"), Color(hex: "240806")
                        ]),
                        center: UnitPoint(x: 0.36, y: 0.30),
                        startRadius: 4, endRadius: 150
                    )
                )
                .frame(width: 230, height: 230)
                .offset(x: 70, y: -70)
                .shadow(color: Color.fpAccent.opacity(0.25), radius: 60)

            // Cloud band along the bottom of the hero
            VStack {
                Spacer()
                Image("LevelsClouds")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(height: 200)
                    .frame(maxWidth: .infinity)
                    .clipped()
                    .blendMode(.screen)
                    .opacity(0.9)
            }

            // Wordmark stack
            VStack(spacing: 14) {
                Text("EARN YOUR ALTITUDE")
                    .font(FPFont.mono(10))
                    .tracking(7)
                    .foregroundColor(.ink2)
                Text("LEVELS")
                    .font(FPFont.display(86))
                    .foregroundColor(.ink)
                    .shadow(color: .black.opacity(0.35), radius: 30, x: 0, y: 8)
                Text("THREE TIERS · ONE FLIGHT PATH")
                    .font(FPFont.mono(10))
                    .tracking(3.2)
                    .foregroundColor(.ink3)
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: 380)
        .clipped()
        .overlay(alignment: .bottom) {
            Rectangle().fill(Color.line).frame(height: 1)
        }
    }

    // MARK: - The Climb

    private var climbSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionKicker("The Climb")
            Text("Badges aren't given.\nThey're earned.")
                .font(FPFont.display(38))
                .foregroundColor(.ink)
                .padding(.top, 14)
            (Text("Every Field Marketer starts on the same runway. Your rank reflects the ")
                .foregroundColor(.ink2)
             + Text("quality leads you put into the pipeline").foregroundColor(.ink)
             + Text(" — and the contracts they close. Climb the tiers, raise your rate, and unlock club gear earned by no one below you.")
                .foregroundColor(.ink2))
                .font(FPFont.sans(16))
                .lineSpacing(5)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 18)

            VStack(alignment: .leading, spacing: 18) {
                MetricItem(label: "Measured By", value: "Closed Contracts / Qtr (from your leads)")
                MetricItem(label: "Paid On", value: "Installed Systems ($/Watt)")
                MetricItem(label: "Unlocks", value: "Higher Rate + Club Gear")
            }
            .padding(.top, 28)
        }
        .padding(.horizontal, 20)
        .padding(.top, 44)
    }

    // MARK: - The Tiers

    private let tiers: [LevelTier] = [
        .init(image: "LevelsTier1", rank: "Tier 01", standing: "Entry · Proven Lead Generator",
              name: "High Flyer",
              specs: [("Requirement", "21+", "Closed / Qtr From Leads"),
                      ("Commission", "$0.20", "Per Watt Installed"),
                      ("Paid Per Install", "$2,000", "@ 10kW Avg System")],
              gear: "High Flyer Club Gear",
              desc: "You're feeding the pipeline. The quality leads you generate are converting into signed contracts — and you've earned your first rate bump.",
              flavor: "You've proven you can do the work and fill the pipeline."),
        .init(image: "LevelsTier2", rank: "Tier 02", standing: "Mid · High-Volume Lead Engine",
              name: "Altitude Club",
              specs: [("Requirement", "28+", "Closed / Qtr From Leads"),
                      ("Commission", "$0.25", "Per Watt Installed"),
                      ("Paid Per Install", "$2,500", "@ 10kW Avg System")],
              gear: "Altitude Club Gear",
              desc: "Your doors are driving serious volume. Sales is closing deal after deal off the leads you provide, and your pay per watt reflects it.",
              flavor: "Cruising altitude. The closers count on your doors."),
        .init(image: "LevelsTier3", rank: "Tier 03", standing: "Elite · Top Of The Field",
              name: "Stratosphere Club",
              specs: [("Requirement", "35+", "Closed / Qtr From Leads"),
                      ("Commission", "$0.30", "Per Watt Installed"),
                      ("Paid Per Install", "$3,000", "@ 10kW Avg System")],
              gear: "Stratosphere Club Gear",
              desc: "You've broken the atmosphere. The top lead-generators in the field — your doors fuel the most installs, and you're paid like it.",
              flavor: "The best in the field. The air is thin up here.")
    ]

    private var tiersSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionKicker("The Tiers")
                .padding(.bottom, 10)
            ForEach(tiers) { tier in
                TierCard(tier: tier)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 56)
    }

    // MARK: - At A Glance matrix

    private let matrixRows: [(String, [String])] = [
        ("Closed Contracts / Qtr", ["21+", "28+", "35+"]),
        ("Commission Rate", ["$0.20/w", "$0.25/w", "$0.30/w"]),
        ("Paid Per Install (10kW)", ["$2,000", "$2,500", "$3,000"]),
        ("Standing", ["Proven Lead Gen", "High-Volume Engine", "Elite — Top Field"]),
        ("Apparel", ["High Flyer Gear", "Altitude Gear", "Stratosphere Gear"])
    ]

    private var matrixSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionKicker("At A Glance")
            Text("THE FLIGHT PATH")
                .font(FPFont.display(36))
                .foregroundColor(.ink)
                .padding(.top, 14)
                .padding(.bottom, 20)

            VStack(spacing: 0) {
                // Header row
                matrixRow(metric: "Metric",
                          values: ["High Flyer", "Altitude", "Stratosphere"],
                          header: true)
                ForEach(matrixRows.indices, id: \.self) { i in
                    Color.line.frame(height: 1)
                    matrixRow(metric: matrixRows[i].0, values: matrixRows[i].1, header: false)
                }
            }
            .cardSurface()
        }
        .padding(.horizontal, 20)
        .padding(.top, 56)
    }

    private func matrixRow(metric: String, values: [String], header: Bool) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text(metric.uppercased())
                .font(FPFont.mono(header ? 9.5 : 9))
                .tracking(0.6)
                .foregroundColor(header ? .ink3 : .ink2)
                .frame(width: 116, alignment: .leading)
            ForEach(values.indices, id: \.self) { i in
                Text(values[i])
                    .font(header ? FPFont.mono(9.5) : FPFont.sans(11, .semibold))
                    .tracking(header ? 0.6 : 0)
                    .foregroundColor(header ? .ink3 : .ink)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }

    // MARK: - Footer

    private var footer: some View {
        HStack {
            Text("SUNRITE SOLAR — LEVELS")
            Spacer()
            Text("EARN YOUR ALTITUDE")
        }
        .font(FPFont.mono(9.5))
        .tracking(1.2)
        .foregroundColor(.ink3)
        .padding(.horizontal, 20)
        .padding(.top, 40)
        .overlay(alignment: .top) {
            Rectangle().fill(Color.line).frame(height: 1)
        }
    }
}

// MARK: - Tier model

private struct LevelTier: Identifiable {
    let id = UUID()
    let image: String
    let rank: String
    let standing: String
    let name: String
    let specs: [(String, String, String)]
    let gear: String
    let desc: String
    let flavor: String
}

// MARK: - Section kicker

private struct SectionKicker: View {
    let text: String
    init(_ text: String) { self.text = text }
    var body: some View {
        Text(text.uppercased())
            .font(FPFont.mono(11))
            .tracking(3.4)
            .foregroundColor(.fpAccent2)
    }
}

private struct MetricItem: View {
    let label: String
    let value: String
    var body: some View {
        HStack(spacing: 14) {
            Rectangle().fill(Color.line).frame(width: 1, height: 38)
            VStack(alignment: .leading, spacing: 6) {
                Text(label.uppercased())
                    .font(FPFont.mono(10))
                    .tracking(1.6)
                    .foregroundColor(.ink3)
                Text(value)
                    .font(FPFont.sans(15, .semibold))
                    .foregroundColor(.ink)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

// MARK: - Tier card

private struct TierCard: View {
    let tier: LevelTier

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Image(tier.image)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(maxWidth: .infinity)
                .frame(height: 200)
                .clipped()
                .clipShape(RoundedRectangle(cornerRadius: FPRadius.card))
                .overlay(
                    RoundedRectangle(cornerRadius: FPRadius.card)
                        .stroke(Color.cardLine, lineWidth: 1)
                )

            // Rank chip + standing
            HStack(spacing: 12) {
                Text(tier.rank)
                    .font(FPFont.mono(10))
                    .tracking(1.4)
                    .foregroundColor(.ink2)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .overlay(Capsule().stroke(Color.line, lineWidth: 1))
                Text(tier.standing.uppercased())
                    .font(FPFont.mono(10))
                    .tracking(1.2)
                    .foregroundColor(.ink3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.top, 20)

            Text(tier.name.uppercased())
                .font(FPFont.display(40))
                .foregroundColor(.ink)
                .padding(.top, 12)
                .padding(.bottom, 18)

            // Specs (3-up grid)
            HStack(spacing: 0) {
                ForEach(tier.specs.indices, id: \.self) { i in
                    if i > 0 { Color.line.frame(width: 1) }
                    VStack(alignment: .leading, spacing: 8) {
                        Text(tier.specs[i].0.uppercased())
                            .font(FPFont.mono(8.5))
                            .tracking(1.2)
                            .foregroundColor(.ink3)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(minHeight: 22, alignment: .topLeading)
                        Text(tier.specs[i].1)
                            .font(FPFont.display(22))
                            .foregroundColor(.ink)
                        Text(tier.specs[i].2.uppercased())
                            .font(FPFont.mono(8))
                            .tracking(0.8)
                            .foregroundColor(.ink3)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                }
            }
            .cardSurface(radius: FPRadius.md)

            // Apparel callout
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "tshirt")
                    .font(.system(size: 16))
                    .foregroundColor(.fpAccent2)
                (Text("Unlocks ").foregroundColor(.ink2)
                 + Text(tier.gear).foregroundColor(.ink)
                 + Text(" — personalized apparel earned only at this tier.").foregroundColor(.ink2))
                    .font(FPFont.mono(11))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .overlay(
                RoundedRectangle(cornerRadius: FPRadius.md)
                    .stroke(style: StrokeStyle(lineWidth: 1, dash: [4, 3]))
                    .foregroundColor(.line)
            )
            .padding(.top, 16)

            Text(tier.desc)
                .font(FPFont.sans(15))
                .foregroundColor(.ink2)
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 16)

            HStack(spacing: 12) {
                Rectangle().fill(Color.fpAccent).frame(width: 2)
                Text(tier.flavor)
                    .font(FPFont.sans(14))
                    .italic()
                    .foregroundColor(.ink3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .fixedSize(horizontal: false, vertical: true)
            .padding(.top, 16)
        }
        .padding(.vertical, 28)
        .overlay(alignment: .top) { Rectangle().fill(Color.line).frame(height: 1) }
    }
}

// MARK: - Calculator

private struct LevelsCalculator: View {
    @State private var contracts: Double = 28
    @State private var rate: Double = 70
    @State private var size: Double = 10

    private var installs: Int { Int((contracts * rate / 100).rounded()) }
    private var watts: Double { size * 1000 }

    private struct Tier { let key: String; let name: String; let rate: Double }
    private var tier: Tier {
        let k = contracts
        if k >= 35 { return Tier(key: "st", name: "Stratosphere Club", rate: 0.30) }
        if k >= 28 { return Tier(key: "al", name: "Altitude Club", rate: 0.25) }
        if k >= 21 { return Tier(key: "hf", name: "High Flyer", rate: 0.20) }
        return Tier(key: "base", name: "Pre-Flight (below High Flyer)", rate: 0.15)
    }

    private var earn: Double { Double(installs) * watts * tier.rate }
    private var eHF: Double { Double(installs) * watts * 0.20 }
    private var eAL: Double { Double(installs) * watts * 0.25 }
    private var eST: Double { Double(installs) * watts * 0.30 }

    private func money(_ x: Double) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.maximumFractionDigits = 0
        return "$" + (f.string(from: NSNumber(value: x.rounded())) ?? "0")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionKicker("Calculator")
            Text("RUN YOUR NUMBERS")
                .font(FPFont.display(36))
                .foregroundColor(.ink)
                .padding(.top, 14)
            (Text("Drag the sliders to see your quarter. Your ")
                .foregroundColor(.ink2)
             + Text("tier").foregroundColor(.ink)
             + Text(" is set by closed contracts from your leads; your ").foregroundColor(.ink2)
             + Text("pay").foregroundColor(.ink)
             + Text(" is per watt on every system that actually installs.").foregroundColor(.ink2))
                .font(FPFont.sans(15))
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 16)

            // Controls
            VStack(spacing: 26) {
                control(label: "Closed Contracts / Quarter",
                        value: "\(Int(contracts))",
                        hint: "Signed contracts sales closes from the leads you provide.",
                        binding: $contracts, range: 0...60, step: 1)
                control(label: "Install Rate",
                        value: "\(Int(rate))%",
                        hint: "% of contracts that reach install. 70% is a respectable, recommended rate.",
                        binding: $rate, range: 40...100, step: 1)
                control(label: "Avg System Size",
                        value: String(format: "%.1f kW", size),
                        hint: "Average installed system size, in kilowatts.",
                        binding: $size, range: 4...16, step: 0.5)
            }
            .padding(.top, 28)

            // Result panel
            resultPanel
                .padding(.top, 28)
        }
        .padding(.horizontal, 20)
        .padding(.top, 56)
    }

    private func control(label: String, value: String, hint: String,
                         binding: Binding<Double>, range: ClosedRange<Double>, step: Double) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text(label.uppercased())
                    .font(FPFont.mono(11))
                    .tracking(1.6)
                    .foregroundColor(.ink2)
                Spacer()
                Text(value)
                    .font(FPFont.sans(14, .bold))
                    .foregroundColor(.ink)
            }
            Slider(value: binding, in: range, step: step)
                .tint(.fpAccent)
            Text(hint.uppercased())
                .font(FPFont.mono(9))
                .tracking(0.5)
                .foregroundColor(.ink3)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var resultPanel: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(tier.name.uppercased())
                .font(FPFont.mono(11))
                .tracking(2.4)
                .foregroundColor(.fpAccent2)
            Text(money(earn))
                .font(FPFont.display(58))
                .foregroundColor(.ink)
                .padding(.top, 8)
            Text("EST. QUARTERLY EARNINGS · \(money(earn * 4)) / YR")
                .font(FPFont.mono(10))
                .tracking(1.2)
                .foregroundColor(.ink3)
                .padding(.top, 6)

            HStack(spacing: 40) {
                resultStat(label: "Installs / Qtr", value: "\(installs)")
                resultStat(label: "Your Rate", value: String(format: "$%.2f / watt", tier.rate))
            }
            .padding(.top, 20)

            // Comparison bars
            Text("SAME VOLUME, EVERY TIER")
                .font(FPFont.mono(9.5))
                .tracking(2)
                .foregroundColor(.ink3)
                .padding(.top, 26)
                .padding(.bottom, 12)

            let maxE = max(eST, 1)
            VStack(spacing: 14) {
                compareBar(name: "High Flyer", value: eHF, fraction: eHF / maxE, active: tier.key == "hf")
                compareBar(name: "Altitude", value: eAL, fraction: eAL / maxE, active: tier.key == "al")
                compareBar(name: "Stratosphere", value: eST, fraction: eST / maxE, active: tier.key == "st")
            }

            deltaMessage
                .padding(.top, 22)
                .overlay(alignment: .top) { Rectangle().fill(Color.line).frame(height: 1) }
        }
        .padding(24)
        .cardSurface(radius: FPRadius.cardLg)
    }

    private func resultStat(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(FPFont.mono(9.5))
                .tracking(1.4)
                .foregroundColor(.ink3)
            Text(value)
                .font(FPFont.sans(18, .bold))
                .foregroundColor(.ink)
        }
    }

    private func compareBar(name: String, value: Double, fraction: Double, active: Bool) -> some View {
        HStack(spacing: 14) {
            Text(name.uppercased())
                .font(FPFont.mono(9.5))
                .tracking(0.8)
                .foregroundColor(active ? .fpAccent2 : .ink2)
                .frame(width: 92, alignment: .leading)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.line)
                    Capsule()
                        .fill(active
                              ? AnyShapeStyle(LinearGradient(colors: [.fpAccent, .fpAccent2],
                                                             startPoint: .leading, endPoint: .trailing))
                              : AnyShapeStyle(Color.ink3))
                        .frame(width: max(0, geo.size.width * CGFloat(fraction)))
                }
            }
            .frame(height: 10)
            Text(money(value))
                .font(FPFont.mono(11))
                .foregroundColor(.ink2)
                .frame(width: 64, alignment: .trailing)
        }
    }

    @ViewBuilder
    private var deltaMessage: some View {
        let text: AttributedString = {
            switch tier.key {
            case "base":
                return attr("Hit ", "21 closed contracts", " to reach High Flyer and unlock $0.20 / watt.")
            case "hf":
                return attr("Reach ", "Altitude Club (28)", " and earn \(money(eAL - eHF)) more this quarter at this volume.")
            case "al":
                return attr("Reach ", "Stratosphere (35)", " and earn \(money(eST - eAL)) more this quarter at this volume.")
            default:
                return attr("Top tier locked in — ", "you're earning the max $0.30 / watt. 🚀", "")
            }
        }()
        Text(text)
            .font(FPFont.mono(11.5))
            .foregroundColor(.ink2)
            .lineSpacing(5)
            .fixedSize(horizontal: false, vertical: true)
    }

    private func attr(_ pre: String, _ bold: String, _ post: String) -> AttributedString {
        var a = AttributedString(pre)
        var b = AttributedString(bold)
        b.foregroundColor = Color.fpAccent2
        let c = AttributedString(post)
        a.append(b); a.append(c)
        return a
    }
}

#Preview {
    LevelsView()
        .preferredColorScheme(.dark)
}
