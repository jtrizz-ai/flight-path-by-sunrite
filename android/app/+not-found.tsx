import { Link, Stack } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { FlightPathBackground } from "@/components/FlightPathBackground";
import { colors, fonts, spacing } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <FlightPathBackground>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>404</Text>
        <Text style={styles.body}>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Back home</Text>
        </Link>
      </View>
    </FlightPathBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 56,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.ink3,
    marginTop: spacing.sm,
  },
  link: {
    marginTop: spacing.lg,
  },
  linkText: {
    fontFamily: fonts.monoBold,
    fontSize: 12,
    color: colors.accent2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
