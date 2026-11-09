import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Cover } from "@/components/book-row";
import type { ReadingStatus } from "@/lib/collection";
import { useCollection } from "@/lib/collection-context";
import { getSeenResult } from "@/lib/search-books";
import { strings } from "@/lib/strings";
import { useColors } from "@/lib/theme";

const STATUSES: ReadingStatus[] = ["want_to_read", "reading", "read"];

export default function BookScreen() {
  const c = useColors();
  const { volumeId } = useLocalSearchParams<{ volumeId: string }>();
  const { books, add, update, remove } = useCollection();
  const [error, setError] = useState<string | null>(null);

  const book = books.find((b) => b.volumeId === volumeId);
  const data = book ?? getSeenResult(volumeId);
  const [note, setNote] = useState(book?.note ?? "");

  if (!data) return <Text style={[styles.pad, { color: c.text }]}>{strings.book.notFound}</Text>;

  async function save(patch: Parameters<typeof update>[1]) {
    setError(null);
    try {
      await update(volumeId, patch);
    } catch (e) {
      console.error("Failed to save book", e);
      setError(strings.book.saveFailed);
    }
  }

  function confirmRemove() {
    Alert.alert(strings.book.removeTitle, strings.book.removeMessage, [
      { text: strings.book.cancel, style: "cancel" },
      {
        text: strings.book.removeConfirm,
        style: "destructive",
        onPress: async () => {
          await remove(volumeId);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <View style={styles.head}>
        <Cover title={data.title} uri={data.coverUrl} size={2} />
        <View style={styles.flex}>
          <Text style={[styles.title, { color: c.text }]}>{data.title}</Text>
          <Text style={{ color: c.subtle }}>
            {data.authors.length ? data.authors.join(", ") : strings.book.unknownAuthor}
          </Text>
          <Text style={{ color: c.subtle }}>{[data.year, data.isbn].filter(Boolean).join(" · ")}</Text>
        </View>
      </View>

      {!book ? (
        <Pressable onPress={() =>
            add(data).catch((e) => {
              console.error("Failed to add book", e);
              setError(strings.book.saveFailed);
            })
          } accessibilityRole="button" style={[styles.primary, { backgroundColor: c.accent }]}>
          <Text style={{ color: c.onAccent, fontWeight: "600" }}>{strings.book.addToCollection}</Text>
        </Pressable>
      ) : (
        <>
          <Text style={[styles.label, { color: c.subtle }]}>{strings.book.status}</Text>
          <View style={styles.wrap}>
            {STATUSES.map((s) => (
              <Pressable
                key={s}
                onPress={() => save({ status: s })}
                accessibilityRole="button"
                accessibilityState={{ selected: book.status === s }}
                style={[styles.chip, { backgroundColor: book.status === s ? c.accent : c.card }]}
              >
                <Text style={{ color: book.status === s ? c.onAccent : c.text }}>{strings.statuses[s]}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: c.subtle }]}>{strings.book.rating}</Text>
          <View style={styles.wrap}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => save({ rating: book.rating === n ? null : n })}
                accessibilityRole="button"
                accessibilityLabel={`${n} star${n > 1 ? "s" : ""}`}
              >
                <Text style={{ fontSize: 32, color: book.rating !== null && n <= book.rating ? c.accent : c.border }}>★</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: c.subtle }]}>{strings.book.note}</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            onBlur={() => save({ note: note.trim() === "" ? null : note })}
            placeholder={strings.book.notePlaceholder}
            placeholderTextColor={c.subtle}
            multiline
            style={[styles.note, { backgroundColor: c.card, color: c.text }]}
          />

          <Pressable onPress={confirmRemove} accessibilityRole="button" style={styles.remove}>
            <Text style={{ color: c.danger }}>{strings.book.remove}</Text>
          </Pressable>
        </>
      )}
      {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  pad: { padding: 16, gap: 8 },
  head: { flexDirection: "row", gap: 16, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700" },
  label: { marginTop: 12, fontSize: 13, textTransform: "uppercase" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  note: { minHeight: 96, padding: 12, borderRadius: 10, fontSize: 16, textAlignVertical: "top" },
  primary: { padding: 14, borderRadius: 10, alignItems: "center", marginTop: 8 },
  remove: { padding: 14, alignItems: "center", marginTop: 16 },
});
