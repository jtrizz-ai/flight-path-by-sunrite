import { ScrollView, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlightPathBackground } from "@/components/FlightPathBackground";
import { MonoLabel, HeroWordmark } from "@/components/Type";
import { Card } from "@/components/Card";
import { colors, fonts, spacing } from "@/constants/theme";

export default function ScheduleScreen() {
  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <MonoLabel style={{ marginBottom: spacing.sm }}>Program</MonoLabel>
          <HeroWordmark>Schedule</HeroWordmark>

          <Card style={{ marginTop: spacing.xl }}>
            <MonoLabel>Status</MonoLabel>
            <Text style={styles.body}>
              Your schedule modules load here once the Notion content reader is
              wired (a later phase).
            </Text>
          </Card>
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
  body: {
    color: colors.ink3,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
