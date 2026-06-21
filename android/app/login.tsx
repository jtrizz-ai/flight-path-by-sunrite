import { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { FlightPathBackground } from "@/components/FlightPathBackground";
import { MonoLabel, HeroWordmark } from "@/components/Type";
import { useAuth } from "@/lib/auth";
import { getBaseUrl } from "@/lib/api";
import { colors, fonts, spacing, radius } from "@/constants/theme";

export default function LoginScreen() {
  const { signIn, signingIn, error, user } = useAuth();
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState<string | null>(null);

  useEffect(() => {
    getBaseUrl().then(setBaseUrl);
  }, []);

  // If somehow already signed in, jump to the app.
  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const noBackend = baseUrl !== null && baseUrl.length === 0;

  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.root}>
          <View style={styles.top}>
            <MonoLabel style={{ marginBottom: spacing.sm }}>Sunrite Solar</MonoLabel>
            <HeroWordmark>Flight Path</HeroWordmark>
            <Text style={styles.subtitle}>
              Sign in with your company Google account
            </Text>
          </View>

          <View style={styles.middle}>
            {noBackend && (
              <View style={styles.warn}>
                <Ionicons name="warning-outline" size={18} color={colors.accent2} />
                <Text style={styles.warnText}>
                  Set your backend URL in Settings before signing in.
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.googleBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={signIn}
              disabled={signingIn}
            >
              {signingIn ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#fff" />
                  <Text style={styles.googleBtnText}>
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          <Link href="/settings" asChild>
            <Pressable hitSlop={12} style={styles.settingsLink}>
              <Ionicons
                name="settings-outline"
                size={18}
                color={colors.ink3}
              />
              <Text style={styles.settingsText}>Settings</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    </FlightPathBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    justifyContent: "space-between",
  },
  top: {
    marginTop: spacing.xxxl,
  },
  subtitle: {
    color: colors.ink2,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    marginTop: spacing.sm,
    textTransform: "uppercase",
  },
  middle: {
    alignItems: "stretch",
    gap: spacing.md,
  },
  warn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,138,91,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,138,91,0.3)",
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  warnText: {
    flex: 1,
    color: colors.accent2,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: "rgba(232,71,42,0.08)",
    borderWidth: 1,
    borderColor: "rgba(232,71,42,0.3)",
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  errorText: {
    color: colors.accent,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.base,
  },
  googleBtnText: {
    color: "#fff",
    fontFamily: fonts.monoBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  settingsLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  settingsText: {
    color: colors.ink3,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
