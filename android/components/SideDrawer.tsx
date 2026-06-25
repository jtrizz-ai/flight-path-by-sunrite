import { useState } from "react";
import { Modal, Pressable, View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useAuth } from "@/lib/auth";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type DrawerLink = {
  title: string;
  href: string;
  icon: IoniconName;
};

const NAV_LINKS: DrawerLink[] = [
  { title: "Home", href: "/", icon: "home-outline" },
  { title: "Library", href: "/library", icon: "book-outline" },
  { title: "Tally", href: "/tally", icon: "stats-chart-outline" },
  { title: "Chat", href: "/chat", icon: "chatbubble-outline" },
];

const EXTRA_LINKS: DrawerLink[] = [
  { title: "Flight Path Program", href: "/program", icon: "airplane-outline" },
  { title: "Levels", href: "/levels", icon: "ribbon-outline" },
  { title: "Roof Knockability", href: "/roof-knockability", icon: "home-outline" },
  { title: "Daily Journal", href: "/journal", icon: "book-outline" },
  { title: "Profile", href: "/profile", icon: "person-outline" },
  { title: "Settings", href: "/settings", icon: "settings-outline" },
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Slide-in navigation drawer (mirrors the iOS / Web hamburger sidebar). */
export function SideDrawer({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();

  const name = user?.fullName || "—";
  const email = user?.email || "";

  const go = (href: string) => {
    onClose();
    router.navigate(href as never);
  };

  const row = (link: DrawerLink) => (
    <Pressable key={link.title} style={styles.row} onPress={() => go(link.href)}>
      <Ionicons name={link.icon} size={19} color={colors.ink3} style={{ width: 19 }} />
      <Text style={styles.rowText}>{link.title}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.panel}>
        {/* User block */}
        <View style={styles.userBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {email}
            </Text>
          </View>
        </View>

        <View style={styles.group}>{NAV_LINKS.map(row)}</View>
        <View style={styles.separator} />
        <View style={styles.group}>{EXTRA_LINKS.map(row)}</View>

        <View style={{ flex: 1 }} />
        <Text style={styles.footer}>SUNRITE SOLAR · FLIGHT PATH v1.0</Text>
      </View>
    </Modal>
  );
}

/** Header hamburger button that owns the drawer's open state. */
export function MenuButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable hitSlop={12} style={{ marginLeft: 16 }} onPress={() => setOpen(true)}>
        {({ pressed }) => (
          <Ionicons
            name="menu"
            size={24}
            color={colors.ink2}
            style={{ opacity: pressed ? 0.5 : 1 }}
          />
        )}
      </Pressable>
      <SideDrawer visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 300,
    maxWidth: "82%",
    backgroundColor: colors.bg2,
    borderLeftWidth: 1,
    borderLeftColor: colors.line,
    paddingHorizontal: 22,
    paddingTop: 64,
    paddingBottom: 28,
  },
  userBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 18,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontFamily: fonts.display,
    fontSize: 18,
  },
  userName: {
    color: colors.ink,
    fontFamily: fonts.sansBold,
    fontSize: 15,
  },
  userEmail: {
    color: colors.ink3,
    fontFamily: fonts.mono,
    fontSize: 10,
    marginTop: 2,
  },
  group: {
    gap: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 10,
    paddingVertical: 13,
    borderRadius: radius.base,
  },
  rowText: {
    color: colors.ink2,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: colors.line,
    marginHorizontal: 4,
    marginVertical: 12,
  },
  footer: {
    color: colors.ink3,
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.3,
    textAlign: "center",
  },
});
