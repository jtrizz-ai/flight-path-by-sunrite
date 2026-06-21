import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { FlightPathBackground } from "@/components/FlightPathBackground";
import { MonoLabel } from "@/components/Type";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import {
  fetchChatThread,
  sendChat,
  type ChatSource,
} from "@/lib/api";

type UIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[] | null;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const thread = await fetchChatThread();
      setMessages(
        thread.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources,
        }))
      );
    } catch {
      // leave empty; user can still send
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true })
    );
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const userMsg: UIMessage = {
      id: `u${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    scrollToBottom();
    try {
      const res = await sendChat(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `a${Date.now()}`,
          role: "assistant",
          content: res.answer,
          sources: res.sources,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a${Date.now()}`,
          role: "assistant",
          content:
            "Sorry — I couldn't reach the Flight Path assistant. Try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  }, [input, sending, scrollToBottom]);

  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={8}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.list}
            onContentSizeChange={scrollToBottom}
          >
            {loading ? (
              <ActivityIndicator
                color={colors.ink2}
                style={{ padding: spacing.xxxl }}
              />
            ) : messages.length === 0 ? (
              <EmptyState />
            ) : (
              messages.map((m) =>
                m.role === "user" ? (
                  <UserBubble key={m.id} text={m.content} />
                ) : (
                  <AssistantBubble
                    key={m.id}
                    text={m.content}
                    sources={m.sources}
                  />
                )
              )
            )}

            {sending && <TypingBubble />}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask the Flight Path assistant…"
              placeholderTextColor={colors.ink3}
              multiline
              maxLength={4000}
              editable={!sending}
            />
            <Pressable
              hitSlop={8}
              style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={!input.trim() || sending}
            >
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </FlightPathBackground>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <MonoLabel style={{ marginBottom: spacing.sm }}>Assistant</MonoLabel>
      <Text style={styles.emptyTitle}>Ask anything about Flight Path</Text>
      <Text style={styles.emptyBody}>
        Sales scripts, schedules, training material — the assistant reads from
        your program content.
      </Text>
    </View>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <View style={styles.userRow}>
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{text}</Text>
      </View>
    </View>
  );
}

function AssistantBubble({
  text,
  sources,
}: {
  text: string;
  sources?: ChatSource[] | null;
}) {
  return (
    <View style={styles.aiRow}>
      <View style={styles.aiBubble}>
        {/* TODO: render markdown (bold/lists/code). Plain text for now. */}
        <Text style={styles.aiText}>{text}</Text>
      </View>
      {sources && sources.length > 0 && (
        <View style={styles.sources}>
          <MonoLabel style={{ marginBottom: spacing.sm }}>Sources</MonoLabel>
          {sources.map((s) => (
            <SourceCard key={s.pageId} source={s} />
          ))}
        </View>
      )}
    </View>
  );
}

function SourceCard({ source }: { source: ChatSource }) {
  return (
    <View style={styles.sourceCard}>
      <Text style={styles.sourceTitle}>{source.title}</Text>
      <Text style={styles.sourceSnippet} numberOfLines={3}>
        {source.snippet}
      </Text>
    </View>
  );
}

function TypingBubble() {
  return (
    <View style={styles.aiRow}>
      <View style={[styles.aiBubble, { flexDirection: "row", alignItems: "center" }]}>
        <Text style={styles.dots}>···</Text>
        <Text style={[styles.aiText, { marginLeft: spacing.xs, opacity: 0.6 }]}>
          thinking
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  empty: {
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
  },
  emptyBody: {
    color: colors.ink3,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  userBubble: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    maxWidth: "85%",
  },
  userText: {
    color: "#fff",
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  aiRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    maxWidth: "92%",
  },
  aiBubble: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: colors.cardLine,
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  aiText: {
    color: colors.ink,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  dots: {
    color: colors.ink2,
    fontFamily: fonts.monoBold,
    fontSize: 18,
    letterSpacing: 3,
  },
  sources: {
    marginTop: spacing.sm,
    width: "100%",
  },
  sourceCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  sourceTitle: {
    color: colors.accent2,
    fontFamily: fonts.monoBold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sourceSnippet: {
    color: colors.ink3,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bg2,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
