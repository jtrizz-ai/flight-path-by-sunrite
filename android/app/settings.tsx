import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

import { FlightPathBackground } from "@/components/FlightPathBackground";
import { MonoLabel } from "@/components/Type";
import { Card } from "@/components/Card";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { getBaseUrl, setBaseUrl, checkHealth, type HealthResult } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function SettingsScreen() {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const { user, signOut, preview, enablePreview, disablePreview } = useAuth();

  useEffect(() => {
    getBaseUrl().then((v) => setUrl(v));
  }, []);

  async function handleSave() {
    setSaving(true);
    await setBaseUrl(url);
    setSaving(false);
    setHealth(null);
  }

  async function handleTest() {
    await handleSave();
    setTesting(true);
    const result = await checkHealth();
    setHealth(result);
    setTesting(false);
  }

  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <MonoLabel style={{ marginBottom: spacing.sm }}>Configuration</MonoLabel>
          <Text style={styles.title}>Settings</Text>

          <Card style={{ marginTop: spacing.xl }}>
            <MonoLabel>Backend URL</MonoLabel>
            <Text style={styles.help}>
              The address of your Flight Path server (over Tailscale/LAN). e.g.
              http://100.101.18.67:3000
            </Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://your-backend"
              placeholderTextColor={colors.ink3}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <View style={styles.row}>
              <Pressable style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
                <Text style={styles.primaryBtnText}>
                  {saving ? "Saving…" : "Save"}
                </Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={handleTest} disabled={testing}>
                {testing ? (
                  <ActivityIndicator color={colors.ink2} />
                ) : (
                  <Text style={styles.secondaryBtnText}>Test Connection</Text>
                )}
              </Pressable>
            </View>

            {health && (
              <View style={styles.statusRow}>
                <MonoLabel>Connection</MonoLabel>
                <Text
                  style={[
                    styles.statusText,
                    { color: health.reachable && health.ok ? colors.success : colors.accent2 },
                  ]}
                >
                  {health.reachable && health.ok ? "● Connected" : "● Not connected"} — {health.detail}
                </Text>
              </View>
            )}
          </Card>

          <Card style={{ marginTop: spacing.md }}>
            <MonoLabel>Account</MonoLabel>
            {user ? (
              <View style={styles.accountRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountName}>
                    {user.fullName || user.email}
                  </Text>
                  <Text style={styles.accountEmail}>{user.email}</Text>
                </View>
                <Link href="/profile" asChild>
                  <Pressable style={styles.editBtn}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </Pressable>
                </Link>
                <Pressable style={styles.signOutBtn} onPress={signOut}>
                  <Text style={styles.signOutText}>Sign Out</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.accountRow}>
                <Text style={styles.body}>Not signed in.</Text>
                <Link href="/login" asChild>
                  <Pressable style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>Sign In</Text>
                  </Pressable>
                </Link>
              </View>
            )}
          </Card>

          <Card style={{ marginTop: spacing.md }}>
            <MonoLabel>About</MonoLabel>
            <Text style={styles.body}>Flight Path · v0.1.0 (Phase 2)</Text>

            {/* ⚠️ TEMPORARY — preview/demo crutch. Remove before launch. */}
            <View style={styles.previewRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.body}>Preview mode (demo, no sign-in)</Text>
              </View>
              <Pressable
                style={
                  preview ? styles.previewBtnOn : styles.previewBtnOff
                }
                onPress={() => (preview ? disablePreview() : enablePreview())}
              >
                <Text style={styles.previewBtnText}>
                  {preview ? "ON" : "OFF"}
                </Text>
              </Pressable>
            </View>
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
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 38,
    color: colors.ink,
    textTransform: "uppercase",
  },
  help: {
    color: colors.ink3,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  input: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.ink,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  primaryBtnText: {
    color: "#fff",
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: colors.ink2,
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statusRow: {
    marginTop: spacing.lg,
  },
  statusText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  body: {
    color: colors.ink3,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  accountName: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  accountEmail: {
    color: colors.ink3,
    fontFamily: fonts.mono,
    fontSize: 11,
    marginTop: 2,
  },
  signOutBtn: {
    borderWidth: 1,
    borderColor: "rgba(232,71,42,0.4)",
    backgroundColor: "rgba(232,71,42,0.12)",
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  signOutText: {
    color: colors.accent,
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  editBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  editBtnText: {
    color: colors.ink2,
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  previewBtnOff: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  previewBtnOn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  previewBtnText: {
    color: "#fff",
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1,
  },
});
