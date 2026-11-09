import { Tabs } from "expo-router";
import { strings } from "@/lib/strings";
import { useColors } from "@/lib/theme";

export default function TabLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
        sceneStyle: { backgroundColor: c.bg },
        tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.border },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.subtle,
        tabBarIcon: () => null,
        tabBarLabelPosition: "beside-icon",
      }}
    >
      <Tabs.Screen name="index" options={{ title: strings.tabs.search }} />
      <Tabs.Screen name="collection" options={{ title: strings.tabs.collection }} />
    </Tabs>
  );
}
