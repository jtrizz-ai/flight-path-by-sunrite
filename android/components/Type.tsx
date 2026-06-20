import { Text, type TextProps } from "react-native";
import { colors, fonts, spacing } from "@/constants/theme";

/** Small uppercase monospaced label (eyebrows, metadata, tags). */
export function MonoLabel({
  children,
  style,
  tracking = 2,
  ...rest
}: TextProps & { tracking?: number }) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.mono,
          fontSize: 10,
          letterSpacing: tracking,
          textTransform: "uppercase",
          color: colors.ink3,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

/** Large display wordmark (one per major view). */
export function HeroWordmark({
  children,
  style,
}: TextProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.display,
          fontSize: 44,
          lineHeight: 46,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.ink,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Simple brand mark: accent diamond. */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <Text
      style={{
        fontFamily: fonts.display,
        fontSize: size,
        color: colors.accent,
        includeFontPadding: false,
      }}
    >
      ◆
    </Text>
  );
}

export { spacing };
