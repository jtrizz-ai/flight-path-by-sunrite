import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  PageSummary,
  PageDetail,
  TallyTotals,
} from "./api";
import type { UserProfile } from "./types";

/**
 * ────────────────────────────────────────────────────────────────────────
 * ⚠️ TEMPORARY — PREVIEW MODE. REMOVE BEFORE LAUNCH. ⚠️
 *
 * Lets the founder tap through the whole app in a browser / Expo Go without
 * doing the Google sign-in + dev-build setup. It seeds SAMPLE data and marks
 * the session as authenticated-with-a-mock-user.
 *
 * This is a demo crutch only — it never holds a real token and must be deleted
 * (or at minimum never enabled in production) before shipping.
 * ────────────────────────────────────────────────────────────────────────
 */

const PREVIEW_KEY = "fp.preview";

export async function isPreviewEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(PREVIEW_KEY)) === "1";
}
export async function setPreviewEnabled(on: boolean): Promise<void> {
  if (on) await AsyncStorage.setItem(PREVIEW_KEY, "1");
  else await AsyncStorage.removeItem(PREVIEW_KEY);
}

export const PREVIEW_USER: UserProfile = {
  id: "preview",
  email: "demo@flightpath.app",
  fullName: "Preview Mode",
  avatarUrl: null,
  phone: null,
  town: "Preview Town",
  region: "North",
  team: "Solar A",
  hireDate: null,
  role: "Sales",
  status: "active",
};

export const PREVIEW_TALLY: TallyTotals = {
  doors: 14,
  conversations: 6,
  appointments: 2,
};

export const PREVIEW_PAGES: PageSummary[] = [
  { id: "p1", title: "Door Pitch Script", slug: "sample-door-pitch", icon: "🚪" },
  { id: "p2", title: "40-Day Schedule", slug: "sample-schedule", icon: "📅" },
  { id: "p3", title: "Objection Handling", slug: "sample-objections", icon: "🛡️" },
  { id: "p4", title: "Recommended Reading", slug: "sample-reading", icon: "📚" },
  { id: "p5", title: "Appointment Set Process", slug: "sample-appointments", icon: "✅" },
  { id: "p6", title: "Financing Options", slug: "sample-financing", icon: "💡" },
];

export const PREVIEW_SAMPLE_PAGE: PageDetail = {
  id: "p1",
  title: "Door Pitch Script",
  slug: "sample-door-pitch",
  icon: "🚪",
  parent_page_id: null,
  content: {
    blocks: [
      { type: "callout", text: "This is sample preview content so you can see how a real Notion page renders in the app.", emoji: "👀" },
      { type: "heading", level: 1, text: "The 30-Second Door Pitch" },
      { type: "paragraph", text: "Smile, state your name, and lead with the benefit. Keep it under 30 seconds." },
      { type: "heading", level: 2, text: "Opening Line" },
      { type: "quote", text: "“Hi, I'm with Sunrite Solar — we're helping neighbors in your area cut their power bill. Got 30 seconds?”" },
      { type: "heading", level: 2, text: "Key Beats" },
      { type: "bulleted_item", text: "Introduce yourself + company" },
      { type: "bulleted_item", text: "Lead with the benefit (lower bill)" },
      { type: "bulleted_item", text: "Ask for permission to continue" },
      { type: "toggle", text: "Common objections (tap to expand)", children: [
        { type: "bulleted_item", text: "“I'm not interested” → acknowledge + pivot" },
        { type: "bulleted_item", text: "“I already have solar” → ask about their experience" },
      ] },
      { type: "heading", level: 2, text: "The Ask" },
      { type: "todo", text: "Set the appointment before leaving the door", checked: false },
      { type: "divider" },
      { type: "code", text: "if (appointment) {\n  followUp();\n}" },
      { type: "page_link", pageId: "p3", title: "Objection Handling", slug: "sample-objections" },
    ],
  },
};

/** A seeded assistant message for the chat demo. */
export const PREVIEW_CHAT_SEED = [
  {
    id: "seed-1",
    role: "assistant" as const,
    content:
      "Hey! This is the Flight Path assistant (preview mode). In the real app I answer from your Notion content — sales scripts, schedules, and more. Try the Library tab to see a sample page.",
    sources: [],
  },
];

export const PREVIEW_CHAT_REPLIES = [
  "Great question! In the real app I'd search your Flight Path content and answer with sources. (Preview mode shows the UI only.)",
  "Preview mode doesn't talk to the live knowledge base — but this is exactly how a real answer + its source citations would appear.",
  "Tap the Library tab to see a sample page rendered with headings, lists, toggles, and more.",
];
