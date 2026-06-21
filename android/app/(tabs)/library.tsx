import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { FlightPathBackground } from "@/components/FlightPathBackground";
import { MonoLabel, HeroWordmark } from "@/components/Type";
import { PreviewBanner } from "@/components/PreviewBanner";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { fetchPages, type PageSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PREVIEW_PAGES } from "@/lib/preview";

export default function LibraryScreen() {
  const router = useRouter();
  const { preview } = useAuth();
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (preview) {
      setPages(PREVIEW_PAGES);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const list = await fetchPages();
      setPages(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pages");
    } finally {
      setLoading(false);
    }
  }, [preview]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => p.title.toLowerCase().includes(q));
  }, [pages, query]);

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
          <MonoLabel style={{ marginBottom: spacing.sm }}>Program</MonoLabel>
          <HeroWordmark>Library</HeroWordmark>

          {preview && <PreviewBanner />}

          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={colors.ink3} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search pages…"
              placeholderTextColor={colors.ink3}
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {loading ? (
            <ActivityIndicator color={colors.ink2} style={{ padding: spacing.xxxl }} />
          ) : filtered.length === 0 ? (
            <Text style={styles.empty}>
              {query ? "No pages match your search." : "No pages published yet."}
            </Text>
          ) : (
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              {filtered.map((p) => (
                <Pressable
                  key={p.id}
                  style={styles.row}
                  onPress={() => router.push(`/page/${p.slug}`)}
                >
                  <Text style={styles.icon}>{p.icon || "📄"}</Text>
                  <Text style={styles.rowTitle}>{p.title}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
                </Pressable>
              ))}
            </View>
          )}
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
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: spacing.md,
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
  empty: {
    color: colors.ink3,
    fontFamily: fonts.mono,
    fontSize: 12,
    padding: spacing.xxxl,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  icon: {
    fontSize: 18,
  },
  rowTitle: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
});
