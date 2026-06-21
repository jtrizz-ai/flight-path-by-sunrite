import { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Linking,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

import { colors, fonts, spacing, radius } from "@/constants/theme";
import type { Block, Run } from "@/lib/api";

function openHref(href: string) {
  Linking.openURL(href).catch(() => {});
}

/** Renders text with optional inline formatting (bold/italic/code/links). */
function RichText({
  text,
  runs,
  base,
}: {
  text: string;
  runs?: Run[];
  base: object;
}) {
  if (!runs || runs.length === 0) {
    return <Text style={base}>{text}</Text>;
  }
  return (
    <Text style={base}>
      {runs.map((r, i) => {
        const s: Text["props"]["style"] = {};
        if (r.bold) s.fontWeight = "bold";
        if (r.italic) s.fontStyle = "italic";
        if (r.strikethrough) s.textDecorationLine = "line-through";
        if (r.code) {
          s.fontFamily = fonts.mono;
          s.color = colors.accent2;
        }
        if (r.href) s.color = colors.accent2;
        return (
          <Text
            key={i}
            style={s}
            onPress={r.href ? () => openHref(r.href!) : undefined}
          >
            {r.text}
          </Text>
        );
      })}
    </Text>
  );
}

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <View style={{ gap: spacing.md }}>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </View>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const size = block.level === 1 ? 24 : block.level === 2 ? 20 : 17;
      return (
        <RichText
          text={block.text}
          runs={block.runs}
          base={{ fontFamily: fonts.sansBold, fontSize: size, color: colors.ink, lineHeight: size + 6, marginTop: spacing.xs }}
        />
      );
    }
    case "paragraph":
      return (
        <RichText
          text={block.text}
          runs={block.runs}
          base={{ fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 22, color: colors.ink2 }}
        />
      );
    case "bulleted_item":
    case "numbered_item":
      return (
        <View style={styles.listRow}>
          <Text style={styles.bullet}>{block.type === "bulleted_item" ? "•" : "▪"}</Text>
          <RichText
            text={block.text}
            runs={block.runs}
            base={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 22, color: colors.ink2 }}
          />
        </View>
      );
    case "todo":
      return (
        <View style={styles.listRow}>
          <Text style={[styles.check, block.checked && { color: colors.accent2 }]}>
            {block.checked ? "✓" : "○"}
          </Text>
          <RichText
            text={block.text}
            runs={block.runs}
            base={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 22, color: block.checked ? colors.ink3 : colors.ink2, textDecorationLine: block.checked ? "line-through" : "none" }}
          />
        </View>
      );
    case "toggle":
      return <ToggleBlock block={block} />;
    case "callout":
      return (
        <View style={styles.callout}>
          {block.emoji ? <Text style={styles.calloutEmoji}>{block.emoji}</Text> : null}
          <RichText
            text={block.text}
            runs={block.runs}
            base={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 21, color: colors.ink }}
          />
        </View>
      );
    case "quote":
      return (
        <View style={{ borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: spacing.md }}>
          <RichText
            text={block.text}
            runs={block.runs}
            base={{ fontFamily: fonts.sansMedium, fontStyle: "italic", fontSize: 15, lineHeight: 22, color: colors.ink }}
          />
        </View>
      );
    case "code":
      return (
        <View style={styles.code}>
          <Text style={styles.codeText}>{block.text}</Text>
        </View>
      );
    case "image":
      return (
        <View>
          {block.url ? (
            <Image
              source={{ uri: block.url }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : null}
          {block.caption ? (
            <Text style={styles.caption}>{block.caption}</Text>
          ) : null}
        </View>
      );
    case "bookmark":
      return (
        <Pressable style={styles.linkCard} onPress={() => openHref(block.url)}>
          <Text style={styles.linkTitle}>{block.title || block.url}</Text>
          <Text style={styles.linkUrl} numberOfLines={1}>{block.url}</Text>
        </Pressable>
      );
    case "file":
      return (
        <Pressable style={styles.linkCard} onPress={() => openHref(block.url)}>
          <Text style={styles.linkTitle}>📎 {block.name || "Attachment"}</Text>
          {block.caption ? <Text style={styles.linkUrl}>{block.caption}</Text> : null}
        </Pressable>
      );
    case "page_link":
      return <PageLinkBlock block={block} />;
    case "divider":
      return <View style={styles.divider} />;
    default:
      // Unknown block types are skipped gracefully (never crash).
      return null;
  }
}

function PageLinkBlock({
  block,
}: {
  block: Extract<Block, { type: "page_link" }>;
}) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.linkCard}
      onPress={() => block.slug && router.push(`/page/${block.slug}`)}
    >
      <Text style={styles.linkTitle}>📄 {block.title}</Text>
      {block.slug ? <Text style={styles.linkUrl}>/{block.slug}</Text> : null}
    </Pressable>
  );
}

function ToggleBlock({ block }: { block: Extract<Block, { type: "toggle" }> }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.toggleBox}>
      <Pressable
        style={styles.toggleHeader}
        onPress={() => setOpen((v) => !v)}
      >
        <Text style={styles.toggleArrow}>{open ? "▾" : "▸"}</Text>
        <RichText
          text={block.text}
          runs={block.runs}
          base={{ flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink }}
        />
      </Pressable>
      {open && block.children.length > 0 && (
        <View style={{ marginTop: spacing.sm }}>
          <BlockRenderer blocks={block.children} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  bullet: {
    color: colors.accent2,
    fontFamily: fonts.sansBold,
    fontSize: 15,
    lineHeight: 22,
    width: 12,
  },
  check: {
    color: colors.ink3,
    fontFamily: fonts.sansBold,
    fontSize: 15,
    lineHeight: 22,
    width: 16,
  },
  callout: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: "rgba(255,138,91,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,138,91,0.2)",
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  calloutEmoji: {
    fontSize: 16,
  },
  code: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  codeText: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.ink2,
    lineHeight: 19,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: radius.base,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  caption: {
    color: colors.ink3,
    fontFamily: fonts.mono,
    fontSize: 11,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  linkCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  linkTitle: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  linkUrl: {
    color: colors.ink3,
    fontFamily: fonts.mono,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: spacing.xs,
  },
  toggleBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  toggleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  toggleArrow: {
    color: colors.accent2,
    fontFamily: fonts.monoBold,
    fontSize: 13,
    width: 14,
  },
});
