import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";

import { FlightPathBackground } from "@/components/FlightPathBackground";
import { Card } from "@/components/Card";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import {
  fetchJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  type JournalEntry,
} from "@/lib/api";

function formatLong(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type Section = {
  key: "wins" | "challenges" | "tomorrows_focus";
  label: string;
  sublabel: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const SECTIONS: Section[] = [
  {
    key: "wins",
    label: "Wins",
    sublabel: "What went well today",
    icon: "checkmark-done",
  },
  {
    key: "challenges",
    label: "Challenges",
    sublabel: "What was tough or didn't go as planned",
    icon: "warning",
  },
  {
    key: "tomorrows_focus",
    label: "Tomorrow's Focus",
    sublabel: "What to tackle next",
    icon: "flag",
  },
];

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const [draft, setDraft] = useState<JournalEntry | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Latest draft for the beforeRemove auto-save (closure-stale workaround).
  const draftRef = useRef<JournalEntry | null>(null);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const entry = await fetchJournalEntry(id);
      setDraft(entry);
      draftRef.current = entry;
      setDirty(false);
      dirtyRef.current = false;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load entry");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: draft ? "Edit Entry" : "Journal" });
  }, [navigation, draft]);

  const patch = (key: keyof JournalEntry, value: string) => {
    if (!draft) return;
    const next: JournalEntry = {
      ...draft,
      [key]: key === "title" ? (value.length ? value : null) : value,
    } as JournalEntry;
    setDraft(next);
    draftRef.current = next;
    setDirty(true);
    dirtyRef.current = true;
  };

  const save = useCallback(
    async (fireAndForget = false) => {
      const cur = draftRef.current;
      if (!cur || savingRef.current) return;
      savingRef.current = true;
      if (!fireAndForget) setSaving(true);
      try {
        const updated = await updateJournalEntry(cur.id, {
          title: cur.title ?? "",
          wins: cur.wins,
          challenges: cur.challenges,
          tomorrows_focus: cur.tomorrows_focus,
        });
        draftRef.current = updated;
        setDraft(updated);
        dirtyRef.current = false;
        setDirty(false);
        setError(null);
      } catch (e) {
        if (!fireAndForget) {
          setError(e instanceof Error ? e.message : "Failed to save");
        }
      } finally {
        savingRef.current = false;
        if (!fireAndForget) setSaving(false);
      }
    },
    []
  );

  // Auto-save on back when there are unsaved edits (mirrors the web client).
  useEffect(() => {
    if (!id) return;
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!dirtyRef.current || savingRef.current) return;
      e.preventDefault();
      void save(true).finally(() => {
        navigation.dispatch(e.data.action);
      });
    });
    return unsubscribe;
  }, [navigation, id, save]);

  const handleDelete = useCallback(async () => {
    if (!draft) return;
    try {
      await deleteJournalEntry(draft.id);
      // Prevent the beforeRemove auto-save from running on the way out.
      dirtyRef.current = false;
      setDirty(false);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  }, [draft, router]);

  if (!draft) {
    return (
      <FlightPathBackground>
        <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
          {error ? (
            <Text style={styles.errorCenter}>{error}</Text>
          ) : (
            <ActivityIndicator
              color={colors.ink2}
              style={{ padding: spacing.xxxl }}
            />
          )}
        </SafeAreaView>
      </FlightPathBackground>
    );
  }

  return (
    <FlightPathBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.dateLabel}>{formatLong(draft.entry_date)}</Text>

          <TextInput
            style={styles.titleInput}
            value={draft.title ?? ""}
            onChangeText={(v) => patch("title", v)}
            placeholder="Give this entry a title…"
            placeholderTextColor={colors.ink3}
          />

          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            {SECTIONS.map((s) => (
              <Card key={s.key} style={{ padding: spacing.base }}>
                <View style={styles.sectionHeader}>
                  <Ionicons name={s.icon} size={16} color={colors.accent} />
                  <Text style={styles.sectionLabel}>{s.label}</Text>
                </View>
                <Text style={styles.sectionSub}>{s.sublabel}</Text>
                <TextInput
                  style={styles.editor}
                  value={(draft[s.key] as string) ?? ""}
                  onChangeText={(v) => patch(s.key as keyof JournalEntry, v)}
                  placeholder={`Write about your ${s.label.toLowerCase()}…`}
                  placeholderTextColor={colors.ink3}
                  multiline
                  textAlignVertical="top"
                />
              </Card>
            ))}
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={() => save(false)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {dirty ? "Save" : "Saved"}
                </Text>
              )}
            </Pressable>

            {!confirmDelete ? (
              <Pressable
                style={styles.deleteBtn}
                onPress={() => setConfirmDelete(true)}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.confirmDeleteBtn}
                onPress={handleDelete}
              >
                <Text style={styles.confirmDeleteText}>Confirm Delete</Text>
              </Pressable>
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
  dateLabel: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  titleInput: {
    color: colors.ink,
    fontFamily: fonts.sansBold,
    fontSize: 24,
    padding: 0,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  sectionLabel: {
    color: colors.ink,
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  sectionSub: {
    color: colors.ink3,
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  editor: {
    color: colors.ink,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    minHeight: 96,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: spacing.xl,
  },
  saveBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.base,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontFamily: fonts.monoBold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  deleteBtn: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: radius.base,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    color: colors.ink3,
    fontFamily: fonts.mono,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  confirmDeleteBtn: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: radius.base,
    backgroundColor: "rgba(232,71,42,0.15)",
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDeleteText: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  errorBox: {
    marginTop: spacing.md,
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
  errorCenter: {
    color: colors.accent,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    textAlign: "center",
    padding: spacing.xxxl,
  },
});
