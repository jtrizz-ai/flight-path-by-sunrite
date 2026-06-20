import { View, StyleSheet, type ViewStyle } from "react-native";
import { colors, radius, spacing } from "@/constants/theme";

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardLine,
    padding: spacing.lg,
  },
});
