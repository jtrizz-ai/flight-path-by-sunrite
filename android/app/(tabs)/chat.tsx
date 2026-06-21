import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";

import { FlightPathBackground } from "@/components/FlightPathBackground";
import { MonoLabel } from "@/components/Type";
import { PreviewBanner } from "@/components/PreviewBanner";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import {
  fetchChatThread,
  sendChat,
  type ChatSource,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PREVIEW_CHAT_SEED, PREVIEW_CHAT_REPLIES } from "@/lib/preview";

type UIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[] | null;
};

type StoredThread = {
  id: string;
  date: string;
  preview: string;
  messages: UIMessage[];
};

const HISTORY_KEY = "fp.chat_history";

async function loadStoredHistory(): Promise<StoredThread[]> {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    return json ? (JSON.parse(json) as StoredThread[]) : [];
  } catch {
    return [];
  }
}

async function archiveThread(messages: UIMessage[]): Promise<void> {
  if (messages.length === 0) return;
  const existing = await loadStoredHistory();
  const firstUser = messages.find((m) => m.role === "user");
  const thread: StoredThread = {
    id: String(Date.now()),
    date: new Date().toISOString(),
    preview: firstUser?.content.slice(0, 100) ?? "Chat",
    messages,
  };
  const updated = [thread, ...existing].slice(0, 30);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatScreen() {
  const { preview } = useAuth();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<StoredThread[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  // Refs so header button callbacks always call the latest handler without
  // re-running useLayoutEffect (which would flash the header).
  const newChatRef = useRef<() => void>(() => {});
  const historyRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          hitSlop={12}
          style={{ marginLeft: 16 }}
          onPress={() => historyRef.current()}
        >
          {({ pressed }) => (
            <Ionicons
              name="time-outline"
              size={22}
              color={colors.ink2}
              style={{ opacity: pressed ? 0.5 : 1 }}
            />
          )}
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          hitSlop={12}
          style={{ marginRight: 16 }}
          onPress={() => newChatRef.current()}
        >
          {({ pressed }) => (
            <Ionicons
              name="add"
              size={28}
              color={colors.ink2}
              style={{ opacity: pressed ? 0.5 : 1 }}
            />
          )}
        </Pressable>
      ),
    });
  }, [navigation]);

  const load = useCallback(async () => {
    if (preview) {
      setMessages(PREVIEW_CHAT_SEED);
      setLoading(false);
      return;
    }
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
  }, [preview]);

  useEffect(() => {
    load();
  }, [load]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true })
    );
  }, []);

  const handleNewChat = useCallback(async () => {
    await archiveThread(messages);
    setMessages([]);
    setInput("");
  }, [messages]);

  const handleOpenHistory = useCallback(async () => {
    const h = await loadStoredHistory();
    setHistory(h);
    setShowHistory(true);
  }, []);

  // Keep refs fresh on every render.
  newChatRef.current = handleNewChat;
  historyRef.current = handleOpenHistory;

  const handleLoadThread = useCallback((thread: StoredThread) => {
    setMessages(thread.messages);
    setShowHistory(false);
  }, []);

  const handleClearHistory = useCallback(async () => {
    await AsyncStorage.removeItem(HISTORY_KEY);
    setHistory([]);
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

    if (preview) {
      const reply =
        PREVIEW_CHAT_REPLIES[Math.floor(Math.random() * PREVIEW_CHAT_REPLIES.length)];
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: `a${Date.now()}`, role: "assistant", content: reply },
        ]);
        setSending(false);
        scrollToBottom();
      }, 700);
      return;
    }

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
  }, [input, sending, scrollToBottom, preview]);

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
            {preview && <PreviewBanner />}
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

            {sending && <ThinkingDots />}
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

      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <HistorySheet
          history={history}
          onLoad={handleLoadThread}
          onClear={handleClearHistory}
          onClose={() => setShowHistory(false)}
        />
      </Modal>
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

// Three dots that bounce up in staggered sequence, like a classic thinking indicator.
function ThinkingDots() {
  const anim0 = useRef(new Animated.Value(0)).current;
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // All three loops have the same total duration so they stay in phase.
    const CYCLE = 1400;
    const STAGGER = 200;
    const UP = 250;
    const DOWN = 250;

    const pulse = (anim: Animated.Value, index: number) => {
      const startDelay = index * STAGGER;
      const endDelay = CYCLE - startDelay - UP - DOWN;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(startDelay),
          Animated.timing(anim, { toValue: 1, duration: UP, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: DOWN, useNativeDriver: true }),
          Animated.delay(endDelay),
        ])
      );
    };

    const l0 = pulse(anim0, 0);
    const l1 = pulse(anim1, 1);
    const l2 = pulse(anim2, 2);
    l0.start();
    l1.start();
    l2.start();
    return () => {
      l0.stop();
      l1.stop();
      l2.stop();
    };
  }, [anim0, anim1, anim2]);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
    ],
  });

  return (
    <View style={styles.aiRow}>
      <View style={[styles.aiBubble, styles.thinkingBubble]}>
        {([anim0, anim1, anim2] as Animated.Value[]).map((anim, i) => (
          <Animated.View key={i} style={[styles.thinkingDot, dotStyle(anim)]} />
        ))}
      </View>
    </View>
  );
}

function HistorySheet({
  history,
  onLoad,
  onClear,
  onClose,
}: {
  history: StoredThread[];
  onLoad: (thread: StoredThread) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <SafeAreaView style={styles.historyContainer} edges={["top", "bottom"]}>
      <View style={styles.historyHeader}>
        <MonoLabel>History</MonoLabel>
        <Pressable onPress={onClose} hitSlop={12}>
          {({ pressed }) => (
            <Ionicons
              name="close"
              size={24}
              color={colors.ink2}
              style={{ opacity: pressed ? 0.5 : 1 }}
            />
          )}
        </Pressable>
      </View>

      {history.length === 0 ? (
        <View style={styles.historyEmpty}>
          <Ionicons name="time-outline" size={42} color={colors.ink3} />
          <Text style={styles.historyEmptyTitle}>No saved chats yet</Text>
          <Text style={styles.historyEmptyBody}>
            Tap + to start a new chat. Your current conversation will be saved
            here automatically.
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.historyList}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onLoad(item)}
                style={({ pressed }) => [
                  styles.historyItem,
                  pressed && { opacity: 0.65 },
                ]}
              >
                <Text style={styles.historyItemDate}>{formatDate(item.date)}</Text>
                <Text style={styles.historyItemPreview} numberOfLines={2}>
                  {item.preview}
                </Text>
                <Text style={styles.historyItemMeta}>
                  {item.messages.length} messages
                </Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: colors.line }} />
            )}
          />
          <Pressable onPress={onClear} style={styles.clearBtn}>
            {({ pressed }) => (
              <Text style={[styles.clearBtnText, pressed && { opacity: 0.5 }]}>
                Clear All History
              </Text>
            )}
          </Pressable>
        </>
      )}
    </SafeAreaView>
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
  thinkingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 18,
  },
  thinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ink2,
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
  // History sheet
  historyContainer: {
    flex: 1,
    backgroundColor: colors.bg2,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  historyEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  historyEmptyTitle: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    marginTop: spacing.sm,
  },
  historyEmptyBody: {
    color: colors.ink3,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  historyList: {
    paddingVertical: spacing.sm,
  },
  historyItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  historyItemDate: {
    color: colors.ink3,
    fontFamily: fonts.mono,
    fontSize: 11,
    marginBottom: 4,
  },
  historyItemPreview: {
    color: colors.ink,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  historyItemMeta: {
    color: colors.ink3,
    fontFamily: fonts.mono,
    fontSize: 11,
    marginTop: 4,
  },
  clearBtn: {
    margin: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.base,
    alignItems: "center",
  },
  clearBtnText: {
    color: colors.accent,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
