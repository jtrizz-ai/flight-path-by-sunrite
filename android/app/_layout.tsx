import { useFonts } from "expo-font";
import {
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

import { navTheme, colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/lib/auth";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Anton: require("../assets/fonts/Anton-Regular.ttf"),
    "Archivo-Medium": require("../assets/fonts/Archivo-Medium.ttf"),
    "Archivo-SemiBold": require("../assets/fonts/Archivo-SemiBold.ttf"),
    "Archivo-Bold": require("../assets/fonts/Archivo-Bold.ttf"),
    "Archivo-Black": require("../assets/fonts/Archivo-Black.ttf"),
    "JetBrainsMono-Regular": require("../assets/fonts/JetBrainsMono-Regular.ttf"),
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
    "JetBrainsMono-Bold": require("../assets/fonts/JetBrainsMono-Bold.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { loading } = useAuth();

  return (
    <>
      <Stack
        screenOptions={{
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.bg2 },
          headerTitleStyle: {
            fontFamily: "Anton",
            fontSize: 18,
          },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="settings"
          options={{ presentation: "modal", title: "Settings" }}
        />
        <Stack.Screen
          name="profile"
          options={{ presentation: "modal", title: "Profile" }}
        />
        <Stack.Screen name="page/[slug]" options={{ title: "Page" }} />
      </Stack>

      <AuthGate />

      {loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={colors.ink2} />
        </View>
      )}
    </>
  );
}

/**
 * Redirects: signed-out users can only see /login and /settings; signed-in
 * users are kept out of /login.
 */
function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const root = segments[0] as string | undefined;
  const inPublicArea = root === "login" || root === "settings";

  useEffect(() => {
    if (loading) return;
    if (!user && !inPublicArea) {
      router.replace("/login");
    } else if (user && root === "login") {
      router.replace("/");
    }
  }, [user, loading, inPublicArea, root, router]);

  return null;
}
