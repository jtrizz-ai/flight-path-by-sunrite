import { ScrollView, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlightPathBackground } from "@/components/FlightPathBackground";
import { MonoLabel, HeroWordmark } from "@/components/Type";
import { Card } from "@/components/Card";
import { colors, fonts, spacing } from "@/constants/theme";

export default function HomeScreen() {
  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <MonoLabel style={{ marginBottom: spacing.sm }}>Sunrite Solar</MonoLabel>
          <HeroWordmark>Flight Path</HeroWordmark>
          <Text style={styles.subtitle}>Your program companion</Text>

          <Card style={{ marginTop: spacing.xl }}>
            <MonoLabel>Recently Updated</MonoLabel>
            <Text style={styles.body}>
              Page listings and the program reader arrive in a later phase.
            </Text>
          </Card>

          <Card style={{ marginTop: spacing.md }}>
            <MonoLabel>Getting Started</MonoLabel>
            <Text style={styles.body}>
              Set your backend URL in Settings, then sign in with your company
              Google account.
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
  subtitle: {
    color: colors.ink2,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    marginTop: spacing.sm,
    textTransform: "uppercase",
  },
  body: {
    color: colors.ink3,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
