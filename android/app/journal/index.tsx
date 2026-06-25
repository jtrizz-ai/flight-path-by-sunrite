import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { FlightPathBackground } from "@/components/FlightPathBackground";
import { MonoLabel, HeroWordmark } from "@/components/Type";
import { Card } from "@/components/Card";
import { colors, fonts, spacing } from "@/constants/theme";
import {
  fetchJournalEntries,
  createJournalEntry,
  ApiError,
  type JournalEntry,
} from "@/lib/api";

function todayString() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function formatShort(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function JournalListScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const list = await fetchJournalEntries();
      setEntries(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openEntry = (id: string) => {
    router.push(`/journal/${id}` as never);
  };

  const createNew = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    try {
      const entry = await createJournalEntry();
      await load();
      openEntry(entry.id);
    } catch (e) {
      // Already exists for today → open that one instead.
      if (e instanceof ApiError && e.status === 409) {
        const today = todayString();
        const existing = entries.find((en) => en.entry_date === today);
        if (existing) {
          openEntry(existing.id);
        } else {
          // List may be stale; refresh then try to resolve.
          const list = await fetchJournalEntries();
          setEntries(list);
          const found = list.find((en) => en.entry_date === today);
          if (found) openEntry(found.id);
        }
      } else {
        setError(e instanceof Error ? e.message : "Failed to create entry");
      }
    } finally {
      setCreating(false);
    }
  }, [creating, entries]);

  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.ink3}
            />
          }
        >
          <MonoLabel style={{ marginBottom: spacing.sm }}>
            Reflect · Grow · Repeat
          </MonoLabel>
          <HeroWordmark>Daily Journal</HeroWordmark>
          <Text style={styles.subtitle}>
            Track your wins, challenges, and what's next.
          </Text>

          <Pressable
            style={[styles.newBtn, creating && { opacity: 0.6 }]}
            onPress={createNew}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.newBtnText}>New Entry</Text>
              </>
            )}
          </Pressable>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={{ marginTop: spacing.lg }}>
            {loading ? (
              <ActivityIndicator
                color={colors.ink2}
                style={{ padding: spacing.xxl }}
              />
            ) : entries.length === 0 ? (
              <Card>
                <Text style={styles.emptyTitle}>No entries yet</Text>
                <Text style={styles.emptyBody}>
                  Tap “New Entry” to start your first journal entry.
                </Text>
              </Card>
            ) : (
              <View style={{ gap: spacing.md }}>
                {entries.map((entry) => (
                  <Pressable
                    key={entry.id}
                    onPress={() => openEntry(entry.id)}
                    style={({ pressed }) => pressed && { opacity: 0.85 }}
                  >
                    <Card style={{ padding: spacing.base }}>
                      <View style={styles.rowTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dateLabel}>
                            {formatShort(entry.entry_date)}
                          </Text>
                          {!!entry.title && (
                            <Text style={styles.title} numberOfLines={1}>
                              {entry.title}
                            </Text>
                          )}
                          {!!entry.wins && (
                            <Text style={styles.preview} numberOfLines={1}>
                              {entry.wins}
                            </Text>
                          )}
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.ink3}
                          style={{ marginTop: 4 }}
                        />
                      </View>
                    </Card>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
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
  subtitle: {
    color: colors.ink2,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.6,
    marginTop: spacing.sm,
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accent,
    marginTop: spacing.lg,
  },
  newBtnText: {
    color: "#fff",
    fontFamily: fonts.monoBold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  errorBox: {
    marginTop: spacing.lg,
    backgroundColor: "rgba(232,71,42,0.08)",
    borderWidth: 1,
    borderColor: "rgba(232,71,42,0.3)",
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  errorText: {
    color: colors.accent,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  dateLabel: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.sansBold,
    fontSize: 15,
  },
  preview: {
    color: colors.ink3,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    marginTop: 4,
  },
  emptyTitle: {
    color: colors.ink3,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  emptyBody: {
    color: colors.ink2,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },
});
