import { Tabs, usePathname } from "expo-router";
import { View } from "react-native";
import { useViewMode } from "@/lib/collection-view";
import { isWooden } from "@/lib/shelves";
import { strings } from "@/lib/strings";
import { useColors } from "@/lib/theme";

export default function TabLayout() {
  const c = useColors();
  // While the Collection shows its shelves, the header and tab bar become part of the bookcase.
  const mode = useViewMode();
  const pathname = usePathname();
  const wooden = isWooden(mode, pathname);
  const wood = () => <View style={{ flex: 1, backgroundImage: c.shelfChrome }} />;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
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
      <Tabs.Screen name="index" options={{ title: strings.tabs.search }} />
      <Tabs.Screen name="collection" options={{ title: strings.tabs.collection }} />
      <Tabs.Screen name="stats" options={{ title: strings.tabs.stats }} />
    </Tabs>
  );
}
