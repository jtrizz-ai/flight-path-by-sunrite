/**
 * Flight Path design tokens — mirrors web/src/app/globals.css.
 * v1 ships DARK MODE FIRST (CLAUDE.md rule 7).
 */

export const colors = {
  bg: "#060607",
  bg2: "#0C0C10",
  accent: "#E8472A",
  accent2: "#FF8A5B",
  ink: "#FFFFFF",
  ink2: "rgba(255, 255, 255, 0.72)",
  ink3: "rgba(255, 255, 255, 0.45)",
  line: "rgba(255, 255, 255, 0.14)",
  card: "rgba(255, 255, 255, 0.045)",
  cardLine: "rgba(255, 255, 255, 0.10)",
  success: "#66BB6A",
} as const;

// Custom fonts are registered by name in app/_layout.tsx (useFonts). Use these
// exact family strings — RN does not synthesize weights for custom fonts.
export const fonts = {
  display: "Anton",
  sansMedium: "Archivo-Medium",
  sansSemiBold: "Archivo-SemiBold",
  sansBold: "Archivo-Bold",
  sansBlack: "Archivo-Black",
  mono: "JetBrainsMono-Regular",
  monoMedium: "JetBrainsMono-Medium",
  monoBold: "JetBrainsMono-Bold",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  base: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

// expo-router ThemeProvider palette (drives nav bar colors). Extends the
// built-in DarkTheme so the required `fonts` field stays valid.
import { DarkTheme } from "expo-router";

export const navTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent2,
    background: colors.bg,
    card: colors.bg2,
    text: colors.ink,
    border: colors.line,
    notification: colors.accent,
  },
};
