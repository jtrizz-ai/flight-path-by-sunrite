import SwiftUI

// MARK: - Roof Knockability — Approved vs. Not Approved roof types
//
// Reference guide for field reps: which roof types qualify for solar and which do not.
// Content mirrors Roof_Knockability_Approved_Not_Approved_CLEAR_IMAGES_v2.pdf

struct RoofKnockabilityView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color.fpBG.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        heroSection
                        quickRefSection
                        approvedSection
                        notApprovedSection
                        footer
                    }
                    .padding(.bottom, 60)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("ROOF KNOCKABILITY")
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

    private var heroSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("SUNRITE FIELD GUIDE")
                .font(FPFont.mono(9.5))
                .tracking(2.8)
                .foregroundColor(.ink3)
            Text("ROOF\nKNOCKA-\nBILITY")
                .font(FPFont.display(58))
                .foregroundColor(.ink)
                .lineSpacing(-2)
            Text("KNOW YOUR ROOFS BEFORE YOU KNOCK")
                .font(FPFont.mono(10))
                .tracking(2.0)
                .foregroundColor(.ink3)
                .padding(.top, 6)
            (Text("Not every roof qualifies for solar. Before you knock, scan the roof. If it's on the ").foregroundColor(.ink2)
             + Text("NOT APPROVED").foregroundColor(.fpAccent)
             + Text(" list, move to the next house. You'll save your time and the homeowner's.").foregroundColor(.ink2))
                .font(FPFont.sans(15))
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 14)
        }
        .padding(.horizontal, 20)
        .padding(.top, 28)
        .padding(.bottom, 36)
    }

    // MARK: - Quick Reference

    private var quickRefSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            RoofKicker("Quick Reference")
            Text("AT A GLANCE")
                .font(FPFont.display(32))
                .foregroundColor(.ink)
                .padding(.top, 10)
                .padding(.bottom, 18)

            HStack(alignment: .top, spacing: 12) {
                // Approved column
                VStack(alignment: .leading, spacing: 0) {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 14))
                            .foregroundColor(Color(hex: "34C759"))
                        Text("APPROVED")
                            .font(FPFont.mono(10, .bold))
                            .tracking(1.6)
                            .foregroundColor(Color(hex: "34C759"))
                    }
                    .padding(.bottom, 12)

                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(approvedRoofs, id: \.name) { roof in
                            HStack(spacing: 8) {
                                Circle()
                                    .fill(Color(hex: "34C759").opacity(0.25))
                                    .frame(width: 6, height: 6)
                                Text(roof.name)
                                    .font(FPFont.mono(10))
                                    .foregroundColor(.ink2)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(14)
                .background(Color(hex: "34C759").opacity(0.05))
                .overlay(RoundedRectangle(cornerRadius: FPRadius.md).stroke(Color(hex: "34C759").opacity(0.22), lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: FPRadius.md))

                // Not Approved column
                VStack(alignment: .leading, spacing: 0) {
                    HStack(spacing: 8) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 14))
                            .foregroundColor(.fpAccent)
                        Text("NOT APPROVED")
                            .font(FPFont.mono(10, .bold))
                            .tracking(1.6)
                            .foregroundColor(.fpAccent)
                    }
                    .padding(.bottom, 12)

                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(notApprovedRoofs, id: \.name) { roof in
                            HStack(spacing: 8) {
                                Circle()
                                    .fill(Color.fpAccent.opacity(0.25))
                                    .frame(width: 6, height: 6)
                                Text(roof.name)
                                    .font(FPFont.mono(10))
                                    .foregroundColor(.ink2)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(14)
                .background(Color.fpAccent.opacity(0.05))
                .overlay(RoundedRectangle(cornerRadius: FPRadius.md).stroke(Color.fpAccent.opacity(0.22), lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: FPRadius.md))
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 44)
        .overlay(alignment: .top) { Rectangle().fill(Color.line).frame(height: 1) }
        .padding(.top, 0)
    }

    // MARK: - Approved

    private var approvedSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            RoofKicker("Approved Roof Types")
            Text("KNOCK THESE")
                .font(FPFont.display(36))
                .foregroundColor(.ink)
                .padding(.top, 10)
            Text("Five roof types that qualify for solar installation.")
                .font(FPFont.mono(11))
                .foregroundColor(.ink3)
                .padding(.top, 6)
                .padding(.bottom, 20)

            VStack(spacing: 12) {
                ForEach(approvedRoofs, id: \.name) { roof in
                    RoofCard(roof: roof, approved: true)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 44)
        .padding(.bottom, 0)
        .overlay(alignment: .top) { Rectangle().fill(Color.line).frame(height: 1) }
    }

    // MARK: - Not Approved

    private var notApprovedSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            RoofKicker("Not Approved Roof Types")
            Text("SKIP THESE")
                .font(FPFont.display(36))
                .foregroundColor(.ink)
                .padding(.top, 10)
            Text("Four roof types that do NOT qualify. Move to the next house.")
                .font(FPFont.mono(11))
                .foregroundColor(.ink3)
                .padding(.top, 6)
                .padding(.bottom, 20)

            VStack(spacing: 12) {
                ForEach(notApprovedRoofs, id: \.name) { roof in
                    RoofCard(roof: roof, approved: false)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 44)
        .padding(.bottom, 0)
        .overlay(alignment: .top) { Rectangle().fill(Color.line).frame(height: 1) }
    }

    // MARK: - Footer

    private var footer: some View {
        HStack {
            Text("SUNRITE SOLAR — ROOF GUIDE")
            Spacer()
            Text("KNOW BEFORE YOU KNOCK")
        }
        .font(FPFont.mono(9.5))
        .tracking(1.2)
        .foregroundColor(.ink3)
        .padding(.horizontal, 20)
        .padding(.top, 40)
        .overlay(alignment: .top) { Rectangle().fill(Color.line).frame(height: 1) }
    }
}

// MARK: - Data

private struct RoofType {
    let name: String
    let systemIcon: String
    let description: String
    let fieldTip: String
}

private let approvedRoofs: [RoofType] = [
    .init(
        name: "Architectural Shingle",
        systemIcon: "house.fill",
        description: "Thick, layered shingles with a dimensional, textured look. The most common roof type in the US.",
        fieldTip: "Overlapping layers give it a \"3D\" texture — easy to spot from the street."
    ),
    .init(
        name: "Three Tab Shingle",
        systemIcon: "house",
        description: "Flat, uniform shingles cut into three equal tabs per strip. Thinner and more uniform than architectural.",
        fieldTip: "Very flat, evenly spaced lines across the roof. Common on homes 20–30+ years old."
    ),
    .init(
        name: "Standing Seam Roof",
        systemIcon: "square.grid.3x3.fill",
        description: "Metal roof with raised vertical seams running from ridge to eave. Highly compatible with solar clamps.",
        fieldTip: "Shiny metal panels with visible raised lines running top-to-bottom. Strong solar candidate."
    ),
    .init(
        name: "Corrugated Metal",
        systemIcon: "waveform.path",
        description: "Wavy or ridged metal sheets. Common on barns, older homes, and agricultural properties.",
        fieldTip: "Wavy ripple pattern across metal panels. Approved — note it in your pitch."
    ),
    .init(
        name: "Rolled Roof / TPO",
        systemIcon: "rectangle.fill",
        description: "Smooth membrane material on flat or low-slope roofs. White or light grey is common for TPO.",
        fieldTip: "Flat roof with a smooth membrane. Usually white or light grey. Solar-ready with ballast mounts."
    ),
]

private let notApprovedRoofs: [RoofType] = [
    .init(
        name: "Foam Roofing",
        systemIcon: "cloud.fill",
        description: "Thick spray-foam coating, typically white or off-white. Cannot support standard solar panel mounting hardware.",
        fieldTip: "Looks like thick white foam sprayed over the roof surface. Skip this house."
    ),
    .init(
        name: "Wood Shake",
        systemIcon: "leaf.fill",
        description: "Cedar or wood shingles with an irregular, rough texture. Fire risk and structural mounting issues.",
        fieldTip: "Rough, uneven wooden shingles — looks natural/rustic. Do not knock this roof."
    ),
    .init(
        name: "Slate Roof",
        systemIcon: "square.stack.fill",
        description: "Heavy natural stone tiles. Extremely fragile — drilling will crack the tiles. Not compatible.",
        fieldTip: "Looks like flat stone or thick grey/blue tiles in neat rows. Very heavy. Walk away."
    ),
    .init(
        name: "Tar & Gravel Roofing",
        systemIcon: "dot.radiowaves.up.forward",
        description: "Flat roof with black tar and loose gravel surface. Not compatible with standard solar mounts.",
        fieldTip: "Flat black roof with visible gravel layer. Rough gravelly texture. Skip it."
    ),
]

// MARK: - Sub-views

private struct RoofKicker: View {
    let text: String
    init(_ text: String) { self.text = text }
    var body: some View {
        Text(text.uppercased())
            .font(FPFont.mono(11))
            .tracking(3.4)
            .foregroundColor(.fpAccent2)
    }
}

private struct RoofCard: View {
    let roof: RoofType
    let approved: Bool

    private var statusColor: Color { approved ? Color(hex: "34C759") : .fpAccent }
    private var statusLabel: String { approved ? "APPROVED" : "NOT APPROVED" }
    private var statusIcon: String { approved ? "checkmark.circle.fill" : "xmark.circle.fill" }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header row
            HStack(alignment: .top, spacing: 14) {
                Image(systemName: roof.systemIcon)
                    .font(.system(size: 20))
                    .foregroundColor(.ink3)
                    .frame(width: 28, alignment: .center)

                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 8) {
                        Text(roof.name)
                            .font(FPFont.sans(15, .bold))
                            .foregroundColor(.ink)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                        HStack(spacing: 5) {
                            Image(systemName: statusIcon)
                                .font(.system(size: 11))
                                .foregroundColor(statusColor)
                            Text(statusLabel)
                                .font(FPFont.mono(9, .bold))
                                .tracking(0.8)
                                .foregroundColor(statusColor)
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(statusColor.opacity(0.10))
                        .clipShape(Capsule())
                        .overlay(Capsule().stroke(statusColor.opacity(0.30), lineWidth: 1))
                    }

                    Text(roof.description)
                        .font(FPFont.sans(13))
                        .foregroundColor(.ink2)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(16)

            // Field tip
            Rectangle().fill(Color.line).frame(height: 1)

            HStack(alignment: .top, spacing: 10) {
                Text("FIELD TIP")
                    .font(FPFont.mono(8.5, .bold))
                    .tracking(1.4)
                    .foregroundColor(.ink3)
                    .frame(width: 58, alignment: .leading)
                Text(roof.fieldTip)
                    .font(FPFont.mono(11))
                    .foregroundColor(.ink2)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .cardSurface(radius: FPRadius.card)
    }
}

#Preview {
    RoofKnockabilityView()
        .preferredColorScheme(.dark)
}
