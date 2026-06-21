import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FlightPathBackground } from "@/components/FlightPathBackground";
import { MonoLabel } from "@/components/Type";
import { PreviewBanner } from "@/components/PreviewBanner";
import { BlockRenderer } from "@/components/Blocks";
import { colors, fonts, spacing } from "@/constants/theme";
import { fetchPage, readBlocks, type PageDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PREVIEW_SAMPLE_PAGE } from "@/lib/preview";

export default function PageDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const navigation = useNavigation();
  const { preview } = useAuth();
  const [page, setPage] = useState<PageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (preview) {
      setPage(PREVIEW_SAMPLE_PAGE);
      setLoading(false);
      return;
    }
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const p = await fetchPage(slug);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load page");
    } finally {
      setLoading(false);
    }
  }, [slug, preview]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: page?.title ?? "Page" });
  }, [navigation, page?.title]);

  const blocks = page ? readBlocks(page) : [];
  const updated = page?.updated_at
    ? new Date(page.updated_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          {loading ? (
            <ActivityIndicator color={colors.ink2} style={{ padding: spacing.xxxl }} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : page ? (
            <>
              <View style={styles.header}>
                {preview && <PreviewBanner />}
                <Text style={styles.icon}>{page.icon || "📄"}</Text>
                <MonoLabel style={{ marginTop: spacing.sm }}>
                  {updated ? `Updated ${updated}` : "Flight Path"}
                </MonoLabel>
                <Text style={styles.title}>{page.title}</Text>
              </View>

              <View style={{ marginTop: spacing.xl }}>
                <BlockRenderer blocks={blocks} />
              </View>
            </>
          ) : (
            <Text style={styles.error}>Page not found.</Text>
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
  header: {
    alignItems: "flex-start",
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 34,
    color: colors.ink,
    textTransform: "uppercase",
    marginTop: spacing.xs,
  },
  error: {
    color: colors.accent,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    padding: spacing.xxxl,
    textAlign: "center",
  },
});
