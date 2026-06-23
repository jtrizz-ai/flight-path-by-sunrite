import { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  PanResponder,
  type ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FlightPathBackground } from "@/components/FlightPathBackground";
import { colors, fonts, spacing, radius } from "@/constants/theme";

// ── Calculator math (mirrors levels.html) ────────────────────────────────────

function money(x: number) {
  return "$" + Math.round(x).toLocaleString("en-US");
}

function tierOf(k: number) {
  if (k >= 35) return { key: "st", name: "Stratosphere Club", rate: 0.3 };
  if (k >= 28) return { key: "al", name: "Altitude Club", rate: 0.25 };
  if (k >= 21) return { key: "hf", name: "High Flyer", rate: 0.2 };
  return { key: "base", name: "Pre-Flight (below High Flyer)", rate: 0.15 };
}

// ── Custom slider (no native slider dependency) ──────────────────────────────

function LevelSlider({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<View>(null);
  const leftRef = useRef(0);
  const widthRef = useRef(0);

  const measure = () => {
    trackRef.current?.measureInWindow((x, _y, w) => {
      leftRef.current = x;
      widthRef.current = w;
    });
  };

  const update = (absX: number) => {
    const w = widthRef.current;
    if (w <= 0) return;
    let r = (absX - leftRef.current) / w;
    r = Math.max(0, Math.min(1, r));
    let v = min + r * (max - min);
    v = Math.round(v / step) * step;
    v = Math.max(min, Math.min(max, v));
    onChange(v);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => update(e.nativeEvent.pageX),
      onPanResponderMove: (e) => update(e.nativeEvent.pageX),
    })
  ).current;

  const pct = max > min ? (value - min) / (max - min) : 0;

  return (
    <View
      ref={trackRef}
      onLayout={measure}
      style={styles.sliderHit}
      {...pan.panHandlers}
    >
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${pct * 100}%` }]} />
      </View>
      <View style={[styles.sliderThumb, { left: `${pct * 100}%` }]} />
    </View>
  );
}

// ── Tier data ────────────────────────────────────────────────────────────────

type Tier = {
  image: ImageSourcePropType;
  rank: string;
  standing: string;
  name: string;
  specs: { l: string; v: string; u: string }[];
  gear: string;
  desc: string;
  flavor: string;
};

const TIERS: Tier[] = [
  {
    image: require("../assets/images/levels_tier1.jpg"),
    rank: "Tier 01",
    standing: "Entry · Proven Lead Generator",
    name: "High Flyer",
    specs: [
      { l: "Requirement", v: "21+", u: "Closed / Qtr From Leads" },
      { l: "Commission", v: "$0.20", u: "Per Watt Installed" },
      { l: "Paid Per Install", v: "$2,000", u: "@ 10kW Avg System" },
    ],
    gear: "High Flyer Club Gear",
    desc: "You're feeding the pipeline. The quality leads you generate are converting into signed contracts — and you've earned your first rate bump.",
    flavor: "You've proven you can do the work and fill the pipeline.",
  },
  {
    image: require("../assets/images/levels_tier2.jpg"),
    rank: "Tier 02",
    standing: "Mid · High-Volume Lead Engine",
    name: "Altitude Club",
    specs: [
      { l: "Requirement", v: "28+", u: "Closed / Qtr From Leads" },
      { l: "Commission", v: "$0.25", u: "Per Watt Installed" },
      { l: "Paid Per Install", v: "$2,500", u: "@ 10kW Avg System" },
    ],
    gear: "Altitude Club Gear",
    desc: "Your doors are driving serious volume. Sales is closing deal after deal off the leads you provide, and your pay per watt reflects it.",
    flavor: "Cruising altitude. The closers count on your doors.",
  },
  {
    image: require("../assets/images/levels_tier3.jpg"),
    rank: "Tier 03",
    standing: "Elite · Top Of The Field",
    name: "Stratosphere Club",
    specs: [
      { l: "Requirement", v: "35+", u: "Closed / Qtr From Leads" },
      { l: "Commission", v: "$0.30", u: "Per Watt Installed" },
      { l: "Paid Per Install", v: "$3,000", u: "@ 10kW Avg System" },
    ],
    gear: "Stratosphere Club Gear",
    desc: "You've broken the atmosphere. The top lead-generators in the field — your doors fuel the most installs, and you're paid like it.",
    flavor: "The best in the field. The air is thin up here.",
  },
];

const MATRIX: { metric: string; values: [string, string, string] }[] = [
  { metric: "Closed / Qtr", values: ["21+", "28+", "35+"] },
  { metric: "Commission", values: ["$0.20/w", "$0.25/w", "$0.30/w"] },
  { metric: "Paid / Install", values: ["$2,000", "$2,500", "$3,000"] },
  { metric: "Standing", values: ["Proven Gen", "High-Vol", "Elite"] },
  { metric: "Apparel", values: ["High Flyer", "Altitude", "Stratosphere"] },
];

// ── Screen ───────────────────────────────────────────────────────────────────

export default function LevelsScreen() {
  const [contracts, setContracts] = useState(28);
  const [rate, setRate] = useState(70);
  const [size, setSize] = useState(10);

  const installs = Math.round((contracts * rate) / 100);
  const watts = size * 1000;
  const tier = tierOf(contracts);
  const earn = installs * watts * tier.rate;
  const eHF = installs * watts * 0.2;
  const eAL = installs * watts * 0.25;
  const eST = installs * watts * 0.3;
  const maxE = Math.max(eST, 1);

  const delta = (() => {
    if (tier.key === "base")
      return "Hit 21 closed contracts to reach High Flyer and unlock $0.20 / watt.";
    if (tier.key === "hf")
      return `Reach Altitude Club (28) and earn ${money(eAL - eHF)} more this quarter at this volume.`;
    if (tier.key === "al")
      return `Reach Stratosphere (35) and earn ${money(eST - eAL)} more this quarter at this volume.`;
    return "Top tier locked in — you're earning the max $0.30 / watt. 🚀";
  })();

  const compareBar = (key: string, name: string, value: number) => {
    const active = tier.key === key;
    return (
      <View style={styles.bar}>
        <Text style={[styles.barLabel, active && { color: colors.accent2 }]}>{name}</Text>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${(value / maxE) * 100}%`, backgroundColor: active ? colors.accent : colors.ink3 },
            ]}
          />
        </View>
        <Text style={styles.barValue}>{money(value)}</Text>
      </View>
    );
  };

  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Hero */}
          <View style={styles.hero}>
            <Image
              source={require("../assets/images/levels_clouds.jpg")}
              style={styles.clouds}
              resizeMode="cover"
            />
            <Text style={styles.eyebrow}>EARN YOUR ALTITUDE</Text>
            <Text style={styles.wordmark}>LEVELS</Text>
            <Text style={styles.heroSub}>THREE TIERS · ONE FLIGHT PATH</Text>
          </View>

          {/* The Climb */}
          <Text style={styles.kicker}>THE CLIMB</Text>
          <Text style={styles.h2}>Badges aren't given.{"\n"}They're earned.</Text>
          <Text style={styles.lede}>
            Every Field Marketer starts on the same runway. Your rank reflects the quality leads you
            put into the pipeline — and the contracts they close. Climb the tiers, raise your rate, and
            unlock club gear earned by no one below you.
          </Text>
          <View style={styles.metrics}>
            <Metric label="Measured By" value="Closed Contracts / Qtr (from your leads)" />
            <Metric label="Paid On" value="Installed Systems ($/Watt)" />
            <Metric label="Unlocks" value="Higher Rate + Club Gear" />
          </View>

          {/* The Tiers */}
          <Text style={[styles.kicker, { marginTop: spacing.xxl }]}>THE TIERS</Text>
          {TIERS.map((t) => (
            <TierCard key={t.name} tier={t} />
          ))}

          {/* At A Glance matrix */}
          <Text style={[styles.kicker, { marginTop: spacing.xxl }]}>AT A GLANCE</Text>
          <Text style={styles.h2}>The Flight Path</Text>
          <View style={styles.matrix}>
            <View style={[styles.matrixRow, styles.matrixHeadRow]}>
              <Text style={[styles.matrixMetric, styles.matrixHead]}>METRIC</Text>
              <Text style={[styles.matrixCell, styles.matrixHead]}>High Flyer</Text>
              <Text style={[styles.matrixCell, styles.matrixHead]}>Altitude</Text>
              <Text style={[styles.matrixCell, styles.matrixHead]}>Strato</Text>
            </View>
            {MATRIX.map((r) => (
              <View key={r.metric} style={styles.matrixRow}>
                <Text style={styles.matrixMetric}>{r.metric.toUpperCase()}</Text>
                {r.values.map((v, i) => (
                  <Text key={i} style={styles.matrixCell}>
                    {v}
                  </Text>
                ))}
              </View>
            ))}
          </View>

          {/* Calculator */}
          <Text style={[styles.kicker, { marginTop: spacing.xxl }]}>CALCULATOR</Text>
          <Text style={styles.h2}>Run Your Numbers</Text>
          <Text style={styles.lede}>
            Drag the sliders to see your quarter. Your tier is set by closed contracts from your leads;
            your pay is per watt on every system that actually installs.
          </Text>

          <View style={styles.controls}>
            <Control label="Closed Contracts / Quarter" value={`${contracts}`} hint="Signed contracts sales closes from the leads you provide.">
              <LevelSlider value={contracts} min={0} max={60} step={1} onChange={setContracts} />
            </Control>
            <Control label="Install Rate" value={`${rate}%`} hint="% of contracts that reach install. 70% is a respectable, recommended rate.">
              <LevelSlider value={rate} min={40} max={100} step={1} onChange={setRate} />
            </Control>
            <Control label="Avg System Size" value={`${size.toFixed(1)} kW`} hint="Average installed system size, in kilowatts.">
              <LevelSlider value={size} min={4} max={16} step={0.5} onChange={setSize} />
            </Control>
          </View>

          {/* Result panel */}
          <View style={styles.result}>
            <Text style={styles.rtier}>{tier.name.toUpperCase()}</Text>
            <Text style={styles.bignum}>{money(earn)}</Text>
            <Text style={styles.rsub}>EST. QUARTERLY EARNINGS · {money(earn * 4)} / YR</Text>

            <View style={styles.rstats}>
              <View>
                <Text style={styles.rstatLabel}>INSTALLS / QTR</Text>
                <Text style={styles.rstatValue}>{installs}</Text>
              </View>
              <View>
                <Text style={styles.rstatLabel}>YOUR RATE</Text>
                <Text style={styles.rstatValue}>${tier.rate.toFixed(2)} / watt</Text>
              </View>
            </View>

            <Text style={styles.cmpTitle}>SAME VOLUME, EVERY TIER</Text>
            {compareBar("hf", "High Flyer", eHF)}
            {compareBar("al", "Altitude", eAL)}
            {compareBar("st", "Stratosphere", eST)}

            <Text style={styles.delta}>{delta}</Text>
          </View>

          <View style={styles.foot}>
            <Text style={styles.footText}>SUNRITE SOLAR — LEVELS</Text>
            <Text style={styles.footText}>EARN YOUR ALTITUDE</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </FlightPathBackground>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Control({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <View style={styles.clabel}>
        <Text style={styles.clabelText}>{label.toUpperCase()}</Text>
        <Text style={styles.cval}>{value}</Text>
      </View>
      {children}
      <Text style={styles.chint}>{hint.toUpperCase()}</Text>
    </View>
  );
}

function TierCard({ tier }: { tier: Tier }) {
  return (
    <View style={styles.tierCard}>
      <Image source={tier.image} style={styles.tierImage} resizeMode="cover" />
      <View style={styles.tierRank}>
        <Text style={styles.chip}>{tier.rank}</Text>
        <Text style={styles.standing}>{tier.standing.toUpperCase()}</Text>
      </View>
      <Text style={styles.tierName}>{tier.name.toUpperCase()}</Text>

      <View style={styles.specs}>
        {tier.specs.map((s, i) => (
          <View key={i} style={[styles.spec, i > 0 && styles.specBorder]}>
            <Text style={styles.specLabel}>{s.l.toUpperCase()}</Text>
            <Text style={styles.specValue}>{s.v}</Text>
            <Text style={styles.specUnit}>{s.u.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <View style={styles.apparel}>
        <Text style={styles.apparelText}>
          Unlocks <Text style={styles.apparelBold}>{tier.gear}</Text> — personalized apparel earned only at this tier.
        </Text>
      </View>

      <Text style={styles.tierDesc}>{tier.desc}</Text>
      <View style={styles.flavor}>
        <Text style={styles.flavorText}>{tier.flavor}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },

  // Hero
  hero: {
    height: 320,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: spacing.xl,
  },
  clouds: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 170,
    opacity: 0.9,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 6,
    color: colors.ink2,
    marginBottom: 12,
  },
  wordmark: {
    fontFamily: fonts.sansBlack,
    fontSize: 78,
    lineHeight: 82,
    letterSpacing: -1,
    color: colors.ink,
    textTransform: "uppercase",
  },
  heroSub: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 3,
    color: colors.ink3,
    marginTop: 12,
  },

  // Section headers
  kicker: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.accent2,
    textTransform: "uppercase",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 38,
    color: colors.ink,
    textTransform: "uppercase",
    paddingHorizontal: spacing.lg,
  },
  lede: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 25,
    color: colors.ink2,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },

  // Metrics
  metrics: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  metric: {
    borderLeftWidth: 1,
    borderLeftColor: colors.line,
    paddingLeft: spacing.md,
  },
  metricLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.ink3,
  },
  metricValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.ink,
    marginTop: 5,
  },

  // Tier card
  tierCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  tierImage: {
    width: "100%",
    height: 190,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.cardLine,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  tierRank: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: spacing.md,
  },
  chip: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.ink2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  standing: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.ink3,
    flexShrink: 1,
  },
  tierName: {
    fontFamily: fonts.display,
    fontSize: 38,
    color: colors.ink,
    textTransform: "uppercase",
    marginTop: 10,
    marginBottom: spacing.md,
  },
  specs: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  spec: {
    flex: 1,
    padding: spacing.md,
  },
  specBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.line,
  },
  specLabel: {
    fontFamily: fonts.mono,
    fontSize: 8.5,
    letterSpacing: 1,
    color: colors.ink3,
    minHeight: 22,
  },
  specValue: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    marginTop: 6,
  },
  specUnit: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 0.5,
    color: colors.ink3,
    marginTop: 5,
  },
  apparel: {
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  apparelText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 17,
    color: colors.ink2,
  },
  apparelBold: {
    fontFamily: fonts.sansBold,
    color: colors.ink,
  },
  tierDesc: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink2,
    marginTop: spacing.md,
  },
  flavor: {
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    paddingLeft: spacing.md,
    marginTop: spacing.md,
  },
  flavorText: {
    fontFamily: fonts.sansMedium,
    fontStyle: "italic",
    fontSize: 14,
    color: colors.ink3,
  },

  // Matrix
  matrix: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  matrixRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  matrixHeadRow: {
    borderTopWidth: 0,
  },
  matrixMetric: {
    flex: 1.5,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.6,
    color: colors.ink2,
  },
  matrixCell: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.ink,
  },
  matrixHead: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.6,
    color: colors.ink3,
  },

  // Calculator controls
  controls: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  clabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: spacing.sm,
  },
  clabelText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.ink2,
    flexShrink: 1,
  },
  cval: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.ink,
  },
  chint: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.4,
    color: colors.ink3,
    marginTop: 10,
  },

  // Slider
  sliderHit: {
    height: 28,
    justifyContent: "center",
  },
  sliderTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  sliderThumb: {
    position: "absolute",
    top: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.ink,
    borderWidth: 3,
    borderColor: colors.accent,
    transform: [{ translateX: -10 }],
  },

  // Result panel
  result: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    padding: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  rtier: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2.4,
    color: colors.accent2,
  },
  bignum: {
    fontFamily: fonts.display,
    fontSize: 56,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  rsub: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.ink3,
    marginTop: 6,
  },
  rstats: {
    flexDirection: "row",
    gap: spacing.xxl,
    marginTop: spacing.lg,
  },
  rstatLabel: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.4,
    color: colors.ink3,
  },
  rstatValue: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colors.ink,
    marginTop: 4,
  },
  cmpTitle: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 2,
    color: colors.ink3,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  barLabel: {
    width: 88,
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: colors.ink2,
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  barValue: {
    width: 64,
    textAlign: "right",
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.ink2,
  },
  delta: {
    fontFamily: fonts.mono,
    fontSize: 11.5,
    lineHeight: 18,
    color: colors.ink2,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },

  // Footer
  foot: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footText: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: colors.ink3,
  },
});
