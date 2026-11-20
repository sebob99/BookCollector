import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { BookRow } from "@/components/book-row";
import { ScanSheet } from "@/components/scan-sheet";
import { useCollection } from "@/lib/collection-context";
import type { SearchResult } from "@/lib/parse-volumes";
import { SearchError, searchBooks } from "@/lib/search-books";
import { strings } from "@/lib/strings";
import { useColors } from "@/lib/theme";

const errorText = (e: unknown) => {
  const kind = e instanceof SearchError ? e.kind : "failed";
  return kind === "missing_key" ? strings.search.missingKey
    : kind === "rate_limited" ? strings.search.rateLimited
    : strings.search.failed;
};

export default function SearchScreen() {
  const c = useColors();
  const { has, byIsbn, add } = useCollection();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextIndex, setNextIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [scanning, setScanning] = useState(false);
  const requestId = useRef(0);

  async function run(q: string, startIndex: number) {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const page = await searchBooks(q, startIndex);
      if (id !== requestId.current) return; // a newer search superseded this one
      setResults((prev) => {
        const base = startIndex === 0 ? [] : prev;
        const known = new Set(base.map((r) => r.volumeId));
        return [...base, ...page.results.filter((r) => !known.has(r.volumeId))]; // pages can overlap
      });
      setNextIndex(page.nextIndex);
      setHasMore(page.hasMore);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(errorText(e));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  function submit(text = input) {
    const q = text.trim();
    if (!q) return;
    setQuery(q);
    setSearched(true);
    setResults([]);
    setHasMore(false);
    run(q, 0);
  }

  const status = error ? (
    <View style={styles.center}>
      <Text style={{ color: c.text, textAlign: "center" }}>{error}</Text>
      <Pressable onPress={() => run(query, nextIndex)} accessibilityRole="button">
        <Text style={{ color: c.accent, padding: 12 }}>{strings.search.retry}</Text>
      </Pressable>
    </View>
  ) : loading && results.length === 0 ? (
    <ActivityIndicator style={styles.center} />
  ) : !searched ? (
    <Text style={[styles.center, { color: c.subtle, textAlign: "center" }]}>{strings.search.hint}</Text>
  ) : results.length === 0 ? (
    <Text style={[styles.center, { color: c.subtle, textAlign: "center" }]}>{strings.search.noResults}</Text>
  ) : null;

  return (
    <View style={styles.flex}>
      <View style={styles.bar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => submit()}
          placeholder={strings.search.placeholder}
          placeholderTextColor={c.subtle}
          returnKeyType="search"
          autoCorrect={false}
          style={[styles.input, { backgroundColor: c.card, color: c.text }]}
        />
        <Pressable onPress={() => setScanning(true)} accessibilityRole="button" accessibilityLabel={strings.scan.open} style={[styles.scan, { backgroundColor: c.card }]}>
          <SymbolView name={{ ios: "barcode.viewfinder", android: "barcode_scanner", web: "barcode_scanner" }} tintColor={c.accent} size={24} />
        </Pressable>
      </View>
      <ScanSheet
        visible={scanning}
        onClose={() => setScanning(false)}
        onIsbn={(isbn) => {
          setScanning(false);
          setInput(isbn);
          // A Book already in the Collection opens directly, without a Catalog search.
          const existing = byIsbn(isbn);
          if (existing) router.push({ pathname: "/book/[volumeId]", params: { volumeId: existing.volumeId, scanned: "1" } });
          else submit(`isbn:${isbn}`);
        }}
      />
      {status}
      <FlatList
        data={results}
        keyExtractor={(r) => r.volumeId}
        keyboardShouldPersistTaps="handled"
        onEndReachedThreshold={0.5}
        onEndReached={() => hasMore && !loading && !error && run(query, nextIndex)}
        ListFooterComponent={loading && results.length > 0 ? <ActivityIndicator style={{ margin: 16 }} /> : undefined}
        renderItem={({ item }) => {
          const existing = has(item.volumeId) ? item : item.isbn ? byIsbn(item.isbn) : undefined;
          const inCollection = existing !== undefined;
          return (
            <BookRow
              {...item}
              onPress={() => router.push({ pathname: "/book/[volumeId]", params: { volumeId: item.volumeId } })}
              right={
                <Pressable
                  onPress={() =>
                    existing
                      ? router.push({ pathname: "/book/[volumeId]", params: { volumeId: existing.volumeId } })
                      : add(item).catch((e) => {
                          console.error("Failed to add book", e);
                          Alert.alert(strings.book.saveFailed);
                        })
                  }
                  accessibilityRole="button"
                  style={[styles.button, { backgroundColor: inCollection ? c.card : c.accent }]}
                >
                  <Text style={{ color: inCollection ? c.subtle : c.onAccent }}>
                    {inCollection ? strings.search.inCollection : strings.search.add}
                  </Text>
                </Pressable>
              }
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { flexDirection: "row", alignItems: "center", margin: 12, gap: 8 },
  input: { flex: 1, padding: 12, borderRadius: 10, fontSize: 16 },
  scan: { padding: 10, borderRadius: 10 },
  center: { alignItems: "center", marginTop: 32, paddingHorizontal: 24 },
  button: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
});
