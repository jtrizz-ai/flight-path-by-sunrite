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

import { FlightPathBackground } from "@/components/FlightPathBackground";
import { MonoLabel, HeroWordmark } from "@/components/Type";
import { Card } from "@/components/Card";
import { PreviewBanner } from "@/components/PreviewBanner";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import {
  fetchTally,
  incrementTally,
  type Metric,
  type TallyTotals,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PREVIEW_TALLY } from "@/lib/preview";

const GOALS: TallyTotals = { doors: 40, conversations: 15, appointments: 5 };
const ZERO: TallyTotals = { doors: 0, conversations: 0, appointments: 0 };

export default function TallyScreen() {
  const { preview } = useAuth();
  const [totals, setTotals] = useState<TallyTotals>(ZERO);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (preview) {
      setTotals(PREVIEW_TALLY);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const t = await fetchTally();
      setTotals(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tally");
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

  const adjust = useCallback(
    async (metric: Metric, amount: 1 | -1) => {
      // optimistic
      const prev = totals[metric];
      setTotals((cur) => ({ ...cur, [metric]: Math.max(0, cur[metric] + amount) }));
      if (preview) return; // local-only in preview mode
      try {
        const t = await incrementTally(metric, amount);
        setTotals(t);
      } catch (e) {
        setTotals((cur) => ({ ...cur, [metric]: prev })); // revert
        setError(e instanceof Error ? e.message : "Failed to update tally");
      }
    },
    [totals, preview]
  );

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
          <MonoLabel style={{ marginBottom: spacing.sm }}>Daily Target</MonoLabel>
          <HeroWordmark>Tally</HeroWordmark>

          {preview && <PreviewBanner />}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={{ marginTop: spacing.xl }}>
            {loading ? (
              <ActivityIndicator color={colors.ink2} style={{ padding: spacing.xxl }} />
            ) : (
              (Object.keys(GOALS) as Metric[]).map((metric) => (
                <TallyRow
                  key={metric}
                  metric={metric}
                  value={totals[metric]}
                  goal={GOALS[metric]}
                  onIncrement={() => adjust(metric, 1)}
                  onDecrement={() => adjust(metric, -1)}
                />
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </FlightPathBackground>
  );
}

function TallyRow({
  metric,
  value,
  goal,
  onIncrement,
  onDecrement,
}: {
  metric: Metric;
  value: number;
  goal: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const label = metric.charAt(0).toUpperCase() + metric.slice(1);
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return (
    <Card style={styles.row}>
      <View style={styles.rowTop}>
        <MonoLabel>{label}</MonoLabel>
        <Text style={styles.goalText}>
          {value} / {goal}
        </Text>
      </View>
      <Text style={[styles.value, value >= goal && { color: colors.accent2 }]}>
        {value}
      </Text>
      {/* progress bar */}
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.accent }]}
        />
      </View>
      <View style={styles.buttons}>
        <Pressable style={styles.minusBtn} onPress={onDecrement} hitSlop={10}>
          <Ionicons name="remove" size={20} color={colors.ink2} />
        </Pressable>
        <Pressable style={styles.plusBtn} onPress={onIncrement} hitSlop={10}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
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
  row: {
    marginBottom: spacing.md,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalText: {
    color: colors.ink3,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 46,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  fill: {
    height: 4,
    borderRadius: 999,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  minusBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  plusBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
});
