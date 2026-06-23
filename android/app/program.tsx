import { Pressable, View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { FlightPathBackground } from "@/components/FlightPathBackground";
import { colors, fonts, spacing, radius } from "@/constants/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type Pillar = {
  index: string;
  title: string;
  description: string;
  icon: IoniconName;
  href: string;
};

const PILLARS: Pillar[] = [
  {
    index: "01",
    title: "Schedule",
    description:
      "Your onboarding roadmap and 40-day work plan. Track milestones from your first knock through your first closed appointment.",
    icon: "calendar",
    href: "/",
  },
  {
    index: "02",
    title: "Tally",
    description:
      "Count every door knocked, every conversation had, and every appointment set. Your daily numbers feed your milestones and badges.",
    icon: "stats-chart",
    href: "/tally",
  },
  {
    index: "03",
    title: "Door Pitch",
    description:
      "The field script and tonality system — the intro, the offer, objection handling, and the appointment funnel that turns a knock into a sit.",
    icon: "mic",
    href: "/library",
  },
  {
    index: "04",
    title: "Levels",
    description:
      "Three earned tiers — High Flyer, Altitude Club, Stratosphere Club. Your rank is set by closed contracts from your leads.",
    icon: "ribbon",
    href: "/levels",
  },
];

const BREAKDOWN: { label: string; text: string; link: string; href: string }[] = [
  {
    label: "Onboarding",
    text: "Start with the Schedule — a guided set of milestones from Week 1 through your first appointments.",
    link: "Schedule",
    href: "/",
  },
  {
    label: "Daily Activity",
    text: "Every door you knock, conversation you start, and appointment you set gets counted in the Tally.",
    link: "Tally",
    href: "/tally",
  },
  {
    label: "The Pitch",
    text: "Learn the field script — the intro, the offer, objection handling, and the appointment funnel.",
    link: "Door Pitch",
    href: "/library",
  },
  {
    label: "The Tiers",
    text: "Closed contracts from your leads earn you rank: High Flyer, Altitude Club, and Stratosphere Club.",
    link: "Levels",
    href: "/levels",
  },
];

export default function ProgramScreen() {
  const router = useRouter();

  const go = (href: string) => {
    router.navigate(href as never);
  };

  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Hero */}
          <Text style={styles.eyebrow}>SUNRITE SOLAR</Text>
          <Text style={styles.wordmark}>FLIGHT PATH{"\n"}PROGRAM</Text>

          {/* Intro */}
          <Text style={styles.introText}>
            The Flight Path Program is SunRite Solar's field sales development
            system. It takes a new Field Marketer from their first door knock to
            a full pipeline of closed contracts — with a guided schedule,
            real-time tally tracking, a proven door pitch, and an earned tier
            system that rewards the quality leads you put into the pipeline.
          </Text>
          <Text style={[styles.introText, { marginTop: spacing.md }]}>
            Everything below is a part of your flight path. Tap any pillar to
            jump straight into it.
          </Text>

          {/* Pillars */}
          <View style={styles.pillars}>
            {PILLARS.map((p) => (
              <Pressable
                key={p.index}
                style={styles.pillarCard}
                onPress={() => go(p.href)}
              >
                <View style={styles.pillarHeader}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={p.icon} size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pillarIndex}>{p.index}</Text>
                    <Text style={styles.pillarTitle}>{p.title.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.pillarDesc}>{p.description}</Text>
                <View style={styles.ctaRow}>
                  <Text style={styles.ctaText}>OPEN</Text>
                  <Ionicons name="arrow-forward" size={12} color={colors.accent} />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Breakdown */}
          <Text style={styles.sectionKicker}>THE BREAKDOWN</Text>
          <View style={styles.breakdown}>
            {BREAKDOWN.map((b, i) => (
              <Pressable
                key={b.label}
                style={[styles.breakdownRow, i > 0 && styles.breakdownBorder]}
                onPress={() => go(b.href)}
              >
                <Text style={styles.breakdownLabel}>{b.label.toUpperCase()}</Text>
                <Text style={styles.breakdownText}>
                  {b.text}{" "}
                  <Text style={styles.breakdownLink}>{b.link}</Text>
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>SUNRITE SOLAR — FLIGHT PATH</Text>
            <Text style={styles.footerText}>CLEARED FOR DEPARTURE</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </FlightPathBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 3.4,
    color: colors.accent2,
    textTransform: "uppercase",
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 46,
    color: colors.ink,
    textTransform: "uppercase",
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  introText: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 25,
    color: colors.ink2,
  },
  pillars: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  pillarCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardLine,
    padding: spacing.base,
  },
  pillarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(232,71,42,0.10)",
    borderWidth: 1,
    borderColor: "rgba(232,71,42,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillarIndex: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.accent2,
  },
  pillarTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    textTransform: "uppercase",
    marginTop: 2,
  },
  pillarDesc: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink2,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  ctaText: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1.0,
    color: colors.accent,
    textTransform: "uppercase",
  },
  sectionKicker: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 3.0,
    color: colors.accent2,
    textTransform: "uppercase",
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  breakdown: {
    gap: 0,
  },
  breakdownRow: {
    paddingVertical: spacing.md,
  },
  breakdownBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  breakdownLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.ink3,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  breakdownText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink2,
  },
  breakdownLink: {
    fontFamily: fonts.sansBold,
    color: colors.accent,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerText: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: colors.ink3,
  },
});
