import { Link, Tabs } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, fonts } from "@/constants/theme";
import { MenuButton } from "@/components/SideDrawer";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.bg2,
          borderTopColor: colors.line,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent2,
        tabBarInactiveTintColor: colors.ink3,
        tabBarLabelStyle: {
          fontFamily: fonts.mono,
          fontSize: 10,
          letterSpacing: 1,
          textTransform: "uppercase",
        },
        headerStyle: { backgroundColor: colors.bg2 },
        headerTintColor: colors.ink,
        headerTitleStyle: {
          fontFamily: fonts.display,
          fontSize: 18,
          textTransform: "uppercase",
        },
        headerShadowVisible: false,
        headerLeft: () => <MenuButton />,
        headerRight: () => (
          <Link href="/settings" asChild>
            <Pressable hitSlop={12} style={{ marginRight: 16 }}>
              {({ pressed }) => (
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={colors.ink2}
                  style={{ opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color }) => <Ionicons name="book" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tally"
        options={{
          title: "Tally",
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
