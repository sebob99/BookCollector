import { Tabs, usePathname } from "expo-router";
import { useRef } from "react";
import { type ColorValue, Text, View } from "react-native";
import { useViewMode } from "@/lib/collection-view";
import { isWooden } from "@/lib/shelves";
import { strings } from "@/lib/strings";
import { serif, useColors } from "@/lib/theme";

export default function TabLayout() {
  const c = useColors();
  // While the Collection shows its shelves, the header and tab bar become part of the bookcase.
  const mode = useViewMode();
  // usePathname is global: on a pushed screen (/book/...) it's no longer a tab path, which would flip the
  // still-visible tab chrome to paper during the fade. Keep the last tab path instead.
  const pathname = usePathname();
  const tabPath = useRef(pathname);
  if (["/", "/search", "/stats"].includes(pathname)) tabPath.current = pathname;
  const wooden = isWooden(mode, tabPath.current);
  const wood = () => <View style={{ flex: 1, backgroundImage: c.shelfChrome }} />;
  // Active tab: bolder label with a short mark underneath (brass on wood, accent on paper).
  const label = (title: string) =>
    function TabLabel({ focused, color }: { focused: boolean; color: ColorValue }) {
      return (
        <View style={{ alignItems: "center", gap: 5 }}>
          <Text style={{ color, fontSize: 15, fontWeight: focused ? "700" : "500" }}>{title}</Text>
          <View style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: focused ? (wooden ? "#e6c987" : c.accent) : "transparent" }} />
        </View>
      );
    };
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTitleStyle: { fontFamily: serif, fontSize: 26 },
        headerTintColor: wooden ? c.onShelf : c.text,
        headerBackground: wooden ? wood : undefined,
        headerShadowVisible: !wooden,
        sceneStyle: { backgroundColor: c.bg },
        tabBarStyle: { backgroundColor: c.bg, borderTopColor: wooden ? c.shelfBack : c.border },
        tabBarBackground: wooden ? wood : undefined,
        tabBarActiveTintColor: wooden ? c.onShelf : c.accent,
        tabBarInactiveTintColor: wooden ? c.onShelfSubtle : c.subtle,
        tabBarIcon: () => null,
        tabBarLabelPosition: "beside-icon",
      }}
    >
      <Tabs.Screen name="index" options={{ title: strings.tabs.collection, tabBarLabel: label(strings.tabs.collection) }} />
      <Tabs.Screen name="search" options={{ title: strings.tabs.search, tabBarLabel: label(strings.tabs.search) }} />
      <Tabs.Screen name="stats" options={{ title: strings.tabs.stats, tabBarLabel: label(strings.tabs.stats) }} />
    </Tabs>
  );
}
