import { useState } from "react";
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
import { useRouter } from "expo-router";

import { FlightPathBackground } from "@/components/FlightPathBackground";
import { MonoLabel } from "@/components/Type";
import { Card } from "@/components/Card";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { updateProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [town, setTown] = useState(user?.town ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        town: town.trim() || null,
      });
      setUser(updated);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <MonoLabel style={{ marginBottom: spacing.sm }}>Your Profile</MonoLabel>
          <Text style={styles.title}>Edit Profile</Text>

          <Card style={{ marginTop: spacing.xl }}>
            <MonoLabel>Email</MonoLabel>
            <Text style={styles.readonly}>{user?.email ?? "—"}</Text>

            <View style={{ height: spacing.lg }} />

            <MonoLabel>Role</MonoLabel>
            <Text style={styles.readonly}>{user?.role ?? "—"}</Text>
          </Card>

          <Card style={{ marginTop: spacing.md }}>
            <Field label="Full Name">
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your name"
                placeholderTextColor={colors.ink3}
              />
            </Field>
            <Field label="Phone">
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="—"
                placeholderTextColor={colors.ink3}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </Field>
            <Field label="Town">
              <TextInput
                style={styles.input}
                value={town}
                onChangeText={setTown}
                placeholder="—"
                placeholderTextColor={colors.ink3}
                autoCapitalize="words"
              />
            </Field>
          </Card>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </FlightPathBackground>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <MonoLabel>{label}</MonoLabel>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 34,
    color: colors.ink,
    textTransform: "uppercase",
  },
  readonly: {
    color: colors.ink2,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  field: {
    marginTop: spacing.md,
  },
  input: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  errorBox: {
    marginTop: spacing.lg,
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
  actions: {
    marginTop: spacing.xl,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.base,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontFamily: fonts.monoBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
