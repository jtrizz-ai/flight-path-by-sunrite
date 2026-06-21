import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, spacing } from "@/constants/theme";

/** Thin banner shown at the top of screens while preview mode is active. */
export function PreviewBanner() {
  return (
    <View style={styles.bar}>
      <Text style={styles.text}>
        ⚠ PREVIEW MODE — sample data, not signed in
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: "rgba(232,71,42,0.12)",
    borderWidth: 1,
    borderColor: "rgba(232,71,42,0.4)",
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  text: {
    color: colors.accent2,
    fontFamily: fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
  },
});
