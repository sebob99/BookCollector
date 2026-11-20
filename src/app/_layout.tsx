import { LibreCaslonText_700Bold, useFonts } from "@expo-google-fonts/libre-caslon-text";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { CollectionProvider } from "@/lib/collection-context";
import { serif, useColors } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const c = useColors();
  const scheme = useColorScheme();
  const [loaded, error] = useFonts({ [serif]: LibreCaslonText_700Bold });
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);
  // Hold the first frame for the serif; if it fails to load, fall back to the system font rather than a blank app.
  if (!loaded && !error) return null;
  return (
    <CollectionProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          // Without a navigation theme the iOS header defaults to light style, and the Liquid Glass back button
          // follows it after the push — black on the dark header. Match the app's scheme instead.
          headerUserInterfaceStyle: scheme === "dark" ? "dark" : "light",
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="book/[volumeId]" options={{ title: "", headerBackButtonDisplayMode: "minimal", animation: "fade", animationDuration: 200 }} />
      </Stack>
    </CollectionProvider>
  );
}
