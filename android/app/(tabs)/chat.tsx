import { View, Text, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlightPathBackground } from "@/components/FlightPathBackground";
import { MonoLabel, HeroWordmark } from "@/components/Type";
import { Card } from "@/components/Card";
import { colors, fonts, spacing, radius } from "@/constants/theme";

export default function ChatScreen() {
  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <View style={styles.content}>
          <MonoLabel style={{ marginBottom: spacing.sm }}>Assistant</MonoLabel>
          <HeroWordmark>Chat</HeroWordmark>

          <Card style={{ marginTop: spacing.xl }}>
            <MonoLabel>Status</MonoLabel>
            <Text style={styles.body}>
              The read-only Flight Path assistant is wired in a later phase.
              Sign in first to enable it.
            </Text>
          </Card>
        </View>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask the Flight Path assistant…"
            placeholderTextColor={colors.ink3}
            editable={false}
          />
        </View>
      </SafeAreaView>
    </FlightPathBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    flex: 1,
  },
  body: {
    color: colors.ink3,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  inputBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  input: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
