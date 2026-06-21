import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { FlightPathBackground } from "@/components/FlightPathBackground";
import { MonoLabel, HeroWordmark } from "@/components/Type";
import { Card } from "@/components/Card";
import { PreviewBanner } from "@/components/PreviewBanner";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { fetchPages, type PageSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PREVIEW_PAGES } from "@/lib/preview";

export default function HomeScreen() {
  const router = useRouter();
  const { preview } = useAuth();
  const [pages, setPages] = useState<PageSummary[]>([]);

  useEffect(() => {
    if (preview) {
      setPages(PREVIEW_PAGES.slice(0, 5));
      return;
    }
    fetchPages()
      .then((list) =>
        setPages(
          [...list]
            .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
            .slice(0, 5)
        )
      )
      .catch(() => {});
  }, [preview]);

  const openPage = useCallback(
    (slug: string) => router.push(`/page/${slug}`),
    [router]
  );

  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <MonoLabel style={{ marginBottom: spacing.sm }}>Sunrite Solar</MonoLabel>
          <HeroWordmark>Flight Path</HeroWordmark>
          <Text style={styles.subtitle}>Your program companion</Text>

          {preview && <PreviewBanner />}

          <Card style={{ marginTop: spacing.xl }}>
            <View style={styles.cardHead}>
              <MonoLabel>Recently Updated</MonoLabel>
              <Pressable hitSlop={8} onPress={() => router.push("/library")}>
                <Text style={styles.link}>Browse all</Text>
              </Pressable>
            </View>

            {pages.length === 0 ? (
              <Text style={styles.body}>
                No pages published yet. Ask an admin to sync Notion.
              </Text>
            ) : (
              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                {pages.map((p) => (
                  <Pressable
                    key={p.id}
                    style={styles.row}
                    onPress={() => openPage(p.slug)}
                  >
                    <Text style={styles.icon}>{p.icon || "📄"}</Text>
                    <Text style={styles.rowTitle}>{p.title}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
                  </Pressable>
                ))}
              </View>
            )}
          </Card>

          <Pressable
            style={styles.chatCard}
            onPress={() => router.push("/chat")}
          >
            <View style={{ flex: 1 }}>
              <MonoLabel>Assistant</MonoLabel>
              <Text style={styles.chatTitle}>Ask the Flight Path assistant</Text>
            </View>
            <Ionicons name="chatbubble-outline" size={22} color={colors.accent2} />
          </Pressable>
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
    fontSize: 12,
    letterSpacing: 1,
    marginTop: spacing.sm,
    textTransform: "uppercase",
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  link: {
    color: colors.accent2,
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  body: {
    color: colors.ink3,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
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
  icon: { fontSize: 18 },
  rowTitle: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "rgba(232,71,42,0.08)",
    borderWidth: 1,
    borderColor: "rgba(232,71,42,0.3)",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  chatTitle: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    marginTop: spacing.xs,
  },
});
