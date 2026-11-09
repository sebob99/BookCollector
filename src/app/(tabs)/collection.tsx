import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { BookRow } from "@/components/book-row";
import { useCollection } from "@/lib/collection-context";
import { strings } from "@/lib/strings";
import { useColors } from "@/lib/theme";

export default function CollectionScreen() {
  const c = useColors();
  const { books } = useCollection();

  if (books.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ color: c.subtle }}>{strings.collection.empty}</Text>
        <Pressable onPress={() => router.navigate("/")} accessibilityRole="button">
          <Text style={{ color: c.accent, padding: 12 }}>{strings.collection.findBooks}</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <FlatList
      data={books}
      keyExtractor={(b) => b.volumeId}
      renderItem={({ item }) => (
        <BookRow
          {...item}
          extra={[strings.statuses[item.status], item.rating ? "★".repeat(item.rating) : null].filter(Boolean).join(" · ")}
          onPress={() => router.push({ pathname: "/book/[volumeId]", params: { volumeId: item.volumeId } })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
