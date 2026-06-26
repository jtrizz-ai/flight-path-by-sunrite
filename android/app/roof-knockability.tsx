import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { FlightPathBackground } from "@/components/FlightPathBackground";
import { colors, fonts, spacing, radius } from "@/constants/theme";

// ── Data ──────────────────────────────────────────────────────────────────────

type RoofType = {
  name: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  description: string;
  fieldTip: string;
};

const APPROVED: RoofType[] = [
  {
    name: "Architectural Shingle",
    icon: "home",
    description:
      "Thick, layered shingles with a dimensional, textured look. The most common roof type in the US.",
    fieldTip:
      "Overlapping layers give it a '3D' texture — easy to spot from the street.",
  },
  {
    name: "Three Tab Shingle",
    icon: "home-outline",
    description:
      "Flat, uniform shingles cut into three equal tabs per strip. Thinner and more uniform than architectural.",
    fieldTip:
      "Very flat, evenly spaced lines across the roof. Common on homes 20–30+ years old.",
  },
  {
    name: "Standing Seam Roof",
    icon: "grid-outline",
    description:
      "Metal roof with raised vertical seams running from ridge to eave. Highly compatible with solar clamps.",
    fieldTip:
      "Shiny metal panels with visible raised lines running top-to-bottom. Strong solar candidate.",
  },
  {
    name: "Corrugated Metal",
    icon: "reorder-four-outline",
    description:
      "Wavy or ridged metal sheets. Common on barns, older homes, and agricultural properties.",
    fieldTip: "Wavy ripple pattern across metal panels. Approved — note it in your pitch.",
  },
  {
    name: "Rolled Roof / TPO",
    icon: "square-outline",
    description:
      "Smooth membrane material on flat or low-slope roofs. White or light grey is common for TPO.",
    fieldTip:
      "Flat roof with a smooth membrane. Usually white or light grey. Solar-ready with ballast mounts.",
  },
];

const NOT_APPROVED: RoofType[] = [
  {
    name: "Foam Roofing",
    icon: "cloud-outline",
    description:
      "Thick spray-foam coating, typically white or off-white. Cannot support standard solar panel mounting hardware.",
    fieldTip: "Looks like thick white foam sprayed over the roof surface. Skip this house.",
  },
  {
    name: "Wood Shake",
    icon: "leaf-outline",
    description:
      "Cedar or wood shingles with an irregular, rough texture. Fire risk and structural mounting issues.",
    fieldTip: "Rough, uneven wooden shingles — looks natural/rustic. Do not knock this roof.",
  },
  {
    name: "Slate Roof",
    icon: "layers-outline",
    description:
      "Heavy natural stone tiles. Extremely fragile — drilling will crack the tiles. Not compatible.",
    fieldTip: "Looks like flat stone or thick grey/blue tiles in neat rows. Very heavy. Walk away.",
  },
  {
    name: "Tar & Gravel Roofing",
    icon: "radio-button-off-outline",
    description:
      "Flat roof with black tar and loose gravel surface. Not compatible with standard solar mounts.",
    fieldTip: "Flat black roof with visible gravel layer. Rough gravelly texture. Skip it.",
  },
];

const APPROVED_GREEN = "#34C759";

// ── Screen ───────────────────────────────────────────────────────────────────

export default function RoofKnockabilityScreen() {
  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>SUNRITE FIELD GUIDE</Text>
            <Text style={styles.wordmark}>ROOF{"\n"}KNOCK-{"\n"}ABILITY</Text>
            <Text style={styles.heroSub}>KNOW YOUR ROOFS BEFORE YOU KNOCK</Text>
            <Text style={styles.heroBody}>
              Not every roof qualifies for solar. Before you knock, scan the roof. If it's on the{" "}
              <Text style={{ color: colors.accent }}>NOT APPROVED</Text> list, move to the next house.
            </Text>
          </View>

          {/* Quick Reference */}
          <Text style={styles.kicker}>QUICK REFERENCE</Text>
          <Text style={styles.h2}>At A Glance</Text>
          <View style={styles.quickRef}>
            <View style={[styles.quickCol, { borderColor: APPROVED_GREEN + "38" }]}>
              <View style={styles.quickHeader}>
                <Ionicons name="checkmark-circle" size={14} color={APPROVED_GREEN} />
                <Text style={[styles.quickLabel, { color: APPROVED_GREEN }]}>APPROVED</Text>
              </View>
              {APPROVED.map((r) => (
                <View key={r.name} style={styles.quickRow}>
                  <View style={[styles.dot, { backgroundColor: APPROVED_GREEN + "66" }]} />
                  <Text style={styles.quickName}>{r.name}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.quickCol, { borderColor: colors.accent + "38" }]}>
              <View style={styles.quickHeader}>
                <Ionicons name="close-circle" size={14} color={colors.accent} />
                <Text style={[styles.quickLabel, { color: colors.accent }]}>NOT APPROVED</Text>
              </View>
              {NOT_APPROVED.map((r) => (
                <View key={r.name} style={styles.quickRow}>
                  <View style={[styles.dot, { backgroundColor: colors.accent + "66" }]} />
                  <Text style={styles.quickName}>{r.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Approved section */}
          <View style={styles.divider} />
          <Text style={styles.kicker}>APPROVED ROOF TYPES</Text>
          <Text style={styles.h2}>Knock These</Text>
          <Text style={styles.sectionSub}>Five roof types that qualify for solar installation.</Text>
          {APPROVED.map((roof) => (
            <RoofCard key={roof.name} roof={roof} approved />
          ))}

          {/* Not Approved section */}
          <View style={styles.divider} />
          <Text style={[styles.kicker, { marginTop: spacing.lg }]}>NOT APPROVED ROOF TYPES</Text>
          <Text style={styles.h2}>Skip These</Text>
          <Text style={styles.sectionSub}>
            Four roof types that do NOT qualify. Move to the next house.
          </Text>
          {NOT_APPROVED.map((roof) => (
            <RoofCard key={roof.name} roof={roof} approved={false} />
          ))}

          {/* Footer */}
          <View style={styles.foot}>
            <Text style={styles.footText}>SUNRITE SOLAR — ROOF GUIDE</Text>
            <Text style={styles.footText}>KNOW BEFORE YOU KNOCK</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </FlightPathBackground>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RoofCard({ roof, approved }: { roof: RoofType; approved: boolean }) {
  const statusColor = approved ? APPROVED_GREEN : colors.accent;
  const statusLabel = approved ? "APPROVED" : "NOT APPROVED";
  const statusIcon: React.ComponentProps<typeof Ionicons>["name"] = approved
    ? "checkmark-circle"
    : "close-circle";

  return (
    <View style={styles.card}>
      {/* Top */}
      <View style={styles.cardTop}>
        <Ionicons name={roof.icon} size={20} color={colors.ink3} style={styles.cardIcon} />
        <View style={{ flex: 1 }}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardName}>{roof.name}</Text>
            <View style={[styles.badge, { borderColor: statusColor + "4D", backgroundColor: statusColor + "1A" }]}>
              <Ionicons name={statusIcon} size={11} color={statusColor} />
              <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>{roof.description}</Text>
        </View>
      </View>

      {/* Field tip */}
      <View style={styles.cardDivider} />
      <View style={styles.tipRow}>
        <Text style={styles.tipLabel}>FIELD TIP</Text>
        <Text style={styles.tipText}>{roof.fieldTip}</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },

  // Hero
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 2.8,
    color: colors.ink3,
    marginBottom: 10,
  },
  wordmark: {
    fontFamily: fonts.sansBlack,
    fontSize: 62,
    lineHeight: 66,
    letterSpacing: -1,
    color: colors.ink,
    textTransform: "uppercase",
  },
  heroSub: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2.0,
    color: colors.ink3,
    marginTop: 10,
    marginBottom: 14,
  },
  heroBody: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink2,
  },

  // Section headers
  kicker: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.accent2,
    textTransform: "uppercase",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 38,
    color: colors.ink,
    textTransform: "uppercase",
    paddingHorizontal: spacing.lg,
  },
  sectionSub: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.ink3,
    paddingHorizontal: spacing.lg,
    marginTop: 6,
    marginBottom: spacing.md,
  },

  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },

  // Quick reference grid
  quickRef: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  quickCol: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  quickHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  quickLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  quickName: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.ink2,
    flexShrink: 1,
  },

  // Roof card
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    gap: spacing.md,
  },
  cardIcon: {
    marginTop: 2,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  cardName: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.ink,
    flexShrink: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontFamily: fonts.monoBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  cardDesc: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.line,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: spacing.md,
  },
  tipLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 8.5,
    letterSpacing: 1.4,
    color: colors.ink3,
    width: 56,
    paddingTop: 2,
  },
  tipText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 17,
    color: colors.ink2,
    flex: 1,
  },

  // Footer
  foot: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footText: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: colors.ink3,
  },
});
