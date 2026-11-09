import { Stack } from "expo-router";
import { CollectionProvider } from "@/lib/collection-context";
import { useColors } from "@/lib/theme";

export default function RootLayout() {
  const c = useColors();
  return (
    <CollectionProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="book/[volumeId]" options={{ title: "", headerBackButtonDisplayMode: "minimal" }} />
      </Stack>
    </CollectionProvider>
  );
}
