import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import Animated, { Easing, FadeInDown, useAnimatedRef, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Image } from "expo-image";
import { findByIsbn, type ReadingStatus } from "@/lib/collection";
import { clothFor } from "@/lib/cloth";
import { useCollection } from "@/lib/collection-context";
import { takeLift } from "@/lib/open-book";
import { getSeenResult } from "@/lib/search-books";
import { strings } from "@/lib/strings";
import { serif, useColors } from "@/lib/theme";

const STATUSES: ReadingStatus[] = ["want_to_read", "reading", "read"];

export default function BookScreen() {
  const c = useColors();
  const { volumeId, scanned } = useLocalSearchParams<{ volumeId: string; scanned?: string }>();
  const { books, add, update, remove } = useCollection();
  const [error, setError] = useState<string | null>(null);

  // A Search result whose ISBN is already in the Collection shows that Book instead.
  const seen = getSeenResult(volumeId);
  const book = books.find((b) => b.volumeId === volumeId) ?? (seen?.isbn ? findByIsbn(books, seen.isbn) : undefined);
  const data = book ?? seen;
  const id = book?.volumeId ?? volumeId;
  const [note, setNote] = useState(book?.note ?? "");
  // Ownership when the screen opened, so the scan banner doesn't flip after "Mark as owned".
  const [ownedOnOpen] = useState(book?.owned);

  // The cover grows from where it was tapped (if known) to its place here.
  const [from] = useState(takeLift);
  const coverRef = useAnimatedRef<Animated.View>();
  const p = useSharedValue(from ? 0 : 1);
  const [flight, setFlight] = useState<{ dx: number; dy: number; s: number } | null>(null);
  useEffect(() => {
    if (!from) return;
    coverRef.current?.measureInWindow((x, y, w) => {
      if (!w) return void (p.value = 1);
      setFlight({ dx: from.x - x, dy: from.y - y, s: from.width / w });
      p.value = withTiming(1, { duration: 460, easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
    });
  }, [from, p, coverRef]);
  const coverStyle = useAnimatedStyle(() => {
    if (!flight) return { opacity: from ? 0 : 1 };
    const k = 1 - p.value;
    return { opacity: 1, transformOrigin: "top left", transform: [{ translateX: flight.dx * k }, { translateY: flight.dy * k }, { scale: 1 + (flight.s - 1) * k }] };
  });

  if (!data) return <Text style={[styles.pad, { color: c.text }]}>{strings.book.notFound}</Text>;

  async function save(patch: Parameters<typeof update>[1]) {
    setError(null);
    try {
      await update(id, patch);
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
          await remove(id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      {/* The book standing on its own lit shelf, as on the Collection. */}
      <View style={[styles.display, { backgroundColor: c.shelfBack, backgroundImage: c.shelfWall }]}>
        {book ? <View pointerEvents="none" style={styles.glow} /> : null}
        <View pointerEvents="none" style={[styles.lamp, !book && styles.lampOff]} />
        <Animated.View ref={coverRef} style={[styles.cover, { backgroundColor: clothFor(data.volumeId) }, coverStyle]}>
          <View style={styles.coverFrame}>
            <Text style={styles.coverTitle}>{data.title}</Text>
            <Text style={styles.coverAuthor}>{data.authors.join(", ")}</Text>
          </View>
          {data.coverUrl ? <Image source={{ uri: data.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`Cover of ${data.title}`} /> : null}
          <View pointerEvents="none" style={styles.sheen} />
        </Animated.View>
        <View style={[styles.plankTop, { backgroundImage: c.shelfTop }]} />
        <View style={[styles.plankLip, { backgroundImage: c.shelfLip }]} />
      </View>

      <Animated.View entering={FadeInDown.delay(180).duration(300)}>
        <Text style={[styles.title, { color: c.text }]}>{data.title}</Text>
        <Text style={[styles.authors, { color: c.subtle }]}>
          {data.authors.length ? data.authors.join(", ") : strings.book.unknownAuthor}
        </Text>
        <Text style={{ color: c.subtle }}>{[data.year, data.isbn].filter(Boolean).join(" · ")}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(260).duration(300)} style={styles.rest}>
      {!book ? (
        <Pressable onPress={() =>
            add(data).catch((e) => {
              console.error("Failed to add book", e);
              setError(strings.book.saveFailed);
            })
          } accessibilityRole="button" style={[styles.primary, { backgroundColor: c.accent }]}>
          <Text style={{ color: c.onAccent, fontWeight: "600", fontSize: 16 }}>{strings.book.addToCollection}</Text>
        </Pressable>
      ) : (
        <>
          {scanned && ownedOnOpen ? (
            <Text accessibilityRole="alert" style={[styles.banner, { backgroundColor: c.card, color: c.text }]}>{strings.book.alreadyOwned}</Text>
          ) : scanned && ownedOnOpen === false && !book.owned ? (
            <View style={[styles.banner, { backgroundColor: c.card }]}>
              <Text accessibilityRole="alert" style={{ color: c.text }}>{strings.book.notOwnedYet}</Text>
              <Pressable onPress={() => save({ owned: true })} accessibilityRole="button" style={[styles.primary, { backgroundColor: c.accent }]}>
                <Text style={{ color: c.onAccent, fontWeight: "600", fontSize: 16 }}>{strings.book.markOwned}</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.ownedRow}>
            <Text style={[styles.label, { color: c.subtle }]}>{strings.book.owned}</Text>
            <Switch value={book.owned} onValueChange={(owned) => save({ owned })} accessibilityLabel={strings.book.owned} />
          </View>

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
                <Text style={{ fontWeight: "600", color: book.status === s ? c.onAccent : c.text }}>{strings.statuses[s]}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: c.subtle }]}>{strings.book.rating}</Text>
          <View style={[styles.wrap, { gap: 2, marginLeft: -6 }]}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => save({ rating: book.rating === n ? null : n })}
                accessibilityRole="button"
                accessibilityLabel={`${n} star${n > 1 ? "s" : ""}`}
                style={styles.star}
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
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 48, gap: 8 },
  rest: { gap: 8 },
  banner: { padding: 12, borderRadius: 10, gap: 8, fontWeight: "600" },
  ownedRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  display: { height: 258, borderRadius: 14, overflow: "hidden", alignItems: "center", marginBottom: 8 },
  glow: {
    position: "absolute", top: 0, bottom: 22, width: 260,
    backgroundImage: "radial-gradient(ellipse farthest-side at 50% 0%, rgba(255, 214, 140, 0.55) 0%, rgba(255, 214, 140, 0.18) 55%, rgba(255, 214, 140, 0) 100%)",
  },
  lamp: { position: "absolute", top: 0, width: 26, height: 6, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, backgroundColor: "#fff3d6", boxShadow: "0 0 10px 3px rgba(255, 214, 140, 0.8)" },
  lampOff: { backgroundColor: "#3a2a20", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" },
  cover: { position: "absolute", bottom: 17, width: 132, height: 198, borderRadius: 5, overflow: "hidden", zIndex: 2, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.55)" },
  coverFrame: { position: "absolute", top: 7, bottom: 7, left: 7, right: 7, borderWidth: 1, borderColor: "rgba(246, 231, 212, 0.45)", borderRadius: 3, justifyContent: "space-between", alignItems: "center", paddingTop: 16, paddingBottom: 10, paddingHorizontal: 3 },
  coverTitle: { fontFamily: serif, fontSize: 14, lineHeight: 17, fontWeight: "700", textAlign: "center", color: "#f6e7d4" },
  coverAuthor: { fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", textAlign: "center", color: "#f6e7d4" },
  sheen: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundImage: "linear-gradient(to bottom, rgba(255, 236, 196, 0.28) 0%, rgba(255, 236, 196, 0) 55%)" },
  plankTop: { position: "absolute", left: 0, right: 0, bottom: 10, height: 12 },
  plankLip: { position: "absolute", left: 0, right: 0, bottom: 0, height: 10 },
  title: { fontFamily: serif, fontSize: 24, lineHeight: 29, fontWeight: "700" },
  authors: { fontSize: 16 },
  label: { marginTop: 14, fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { height: 44, paddingHorizontal: 16, borderRadius: 22, justifyContent: "center" },
  star: { width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  note: { minHeight: 96, padding: 12, borderRadius: 10, fontSize: 16, textAlignVertical: "top" },
  primary: { height: 50, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 12 },
  remove: { height: 50, alignItems: "center", justifyContent: "center", marginTop: 8 },
});
