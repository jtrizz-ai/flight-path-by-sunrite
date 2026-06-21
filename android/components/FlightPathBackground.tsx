import { View, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

/**
 * Soft dark background: solid near-black base with two faint accent glows.
 * Avoids pure black (CLAUDE.md iOS/web design spec).
 */
export function FlightPathBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <View style={styles.glowA} />
      <View style={styles.glowB} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    overflow: "hidden",
  },
  glowA: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: colors.accent,
    opacity: 0.08,
  },
  glowB: {
    position: "absolute",
    bottom: -140,
    left: -100,
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: colors.accent2,
    opacity: 0.05,
  },
});
