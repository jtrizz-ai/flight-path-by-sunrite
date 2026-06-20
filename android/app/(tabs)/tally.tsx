import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlightPathBackground } from "@/components/FlightPathBackground";
import { MonoLabel, HeroWordmark } from "@/components/Type";
import { Card } from "@/components/Card";
import { colors, fonts, spacing } from "@/constants/theme";

const GOALS = { doors: 40, conversations: 15, appointments: 5 } as const;

export default function TallyScreen() {
  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <View style={styles.content}>
          <MonoLabel style={{ marginBottom: spacing.sm }}>Daily Target</MonoLabel>
          <HeroWordmark>Tally</HeroWordmark>

          <View style={{ marginTop: spacing.xl }}>
            <Stat label="Doors" value={0} goal={GOALS.doors} accent />
            <Stat label="Conversations" value={0} goal={GOALS.conversations} />
            <Stat label="Appointments" value={0} goal={GOALS.appointments} />
          </View>
        </View>
      </SafeAreaView>
    </FlightPathBackground>
  );
}

function Stat({
  label,
  value,
  goal,
  accent,
}: {
  label: string;
  value: number;
  goal: number;
  accent?: boolean;
}) {
  return (
    <Card style={styles.stat}>
      <MonoLabel>{label}</MonoLabel>
      <View style={styles.row}>
        <Text
          style={[styles.value, { color: accent ? colors.accent2 : colors.ink }]}
        >
          {value}
        </Text>
        <Text style={styles.goal}>/ {goal}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  stat: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: spacing.xs,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 42,
  },
  goal: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.ink3,
    marginLeft: spacing.sm,
  },
});
