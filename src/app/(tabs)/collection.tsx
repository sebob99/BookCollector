import { router, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BookRow, Cover } from "@/components/book-row";
import type { Book } from "@/lib/collection";
import { useCollection } from "@/lib/collection-context";
import { setViewMode, useViewMode } from "@/lib/collection-view";
import { chunk, columnsFor, COVER_GAP, COVER_WIDTH } from "@/lib/cover-grid";
import { strings } from "@/lib/strings";
import { useColors } from "@/lib/theme";

const SHELF_HEADROOM = 28;
const BOOK_OVERLAP = 5;
const PLANK_TOP = 12;
const PLANK_LIP = 10;
const ROW_HEIGHT = SHELF_HEADROOM + COVER_WIDTH * 1.5 - BOOK_OVERLAP + PLANK_TOP + PLANK_LIP;

const openBook = (volumeId: string) => router.push({ pathname: "/book/[volumeId]", params: { volumeId } });

export default function CollectionScreen() {
  const c = useColors();
  const { books } = useCollection();
  const { width } = useWindowDimensions();
  const mode = useViewMode();

  const [listHeight, setListHeight] = useState(0);

  const columns = columnsFor(width);
  // Pad with empty shelves so the bookcase always fills the screen, however few books there are.
  const rows = useMemo(() => {
    const filled = chunk(books, columns);
    while (filled.length * ROW_HEIGHT < listHeight) filled.push([]);
    return filled;
  }, [books, columns, listHeight]);

  const toggle = () => setViewMode(mode === "covers" ? "list" : "covers");
  // The header is wooden only while shelves are showing (see the tab layout), so the icon follows it.
  const tint = mode === "covers" && books.length > 0 ? c.onShelf : c.accent;

  const toggleLabel = mode === "covers" ? strings.collection.showList : strings.collection.showCovers;
  const header = (
    <Tabs.Screen
      options={{
        headerRight: () => (
          <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={toggleLabel} hitSlop={8} style={styles.toggle}>
            <SymbolView
              name={
                mode === "covers"
                  ? { ios: "list.bullet", android: "view_list", web: "view_list" }
                  : { ios: "square.grid.2x2", android: "grid_view", web: "grid_view" }
              }
              size={22}
              tintColor={tint}
              fallback={<Text style={{ color: tint }}>{toggleLabel}</Text>}
            />
          </Pressable>
        ),
      }}
    />
  );

  if (books.length === 0) {
    return (
      <View style={styles.center}>
        {header}
        <Text style={{ color: c.subtle }}>{strings.collection.empty}</Text>
        <Pressable onPress={() => router.navigate("/")} accessibilityRole="button">
          <Text style={{ color: c.accent, padding: 12 }}>{strings.collection.findBooks}</Text>
        </Pressable>
      </View>
    );
  }

  if (mode === "list") {
    return (
      <>
        {header}
        <FlatList
          data={books}
          keyExtractor={(b) => b.volumeId}
          renderItem={({ item }) => (
            <BookRow
              {...item}
              extra={[strings.statuses[item.status], item.rating ? "★".repeat(item.rating) : null].filter(Boolean).join(" · ")}
              onPress={() => openBook(item.volumeId)}
            />
          )}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <FlatList
        data={rows}
        style={{ backgroundColor: c.shelfBack }}
        onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
        keyExtractor={(row, i) => row[0]?.volumeId ?? `empty-${i}`}
        renderItem={({ item: row }) => <CoverRow books={row} columns={columns} />}
      />
    </>
  );
}

function CoverRow({ books, columns }: { books: Book[]; columns: number }) {
  const c = useColors();
  return (
    <View style={{ backgroundImage: c.shelfWall }}>
      <View style={styles.covers}>
        {/* Always `columns` slots, so a short last row stays left-aligned instead of stretching. */}
        {Array.from({ length: columns }, (_, i) => {
          const book = books[i];
          return (
            <View key={book?.volumeId ?? i} style={styles.slot}>
              {book ? <View pointerEvents="none" style={styles.glow} /> : null}
              <View pointerEvents="none" style={[styles.lamp, !book && styles.lampOff]} />
              {book ? (
                <Pressable
                  onPress={() => openBook(book.volumeId)}
                  accessibilityRole="button"
                  accessibilityLabel={strings.collection.bookLabel(book.title, book.authors)}
                  style={({ pressed }) => [styles.book, pressed && styles.pressed]}
                >
                  <Cover title={book.title} uri={book.coverUrl} size={COVER_WIDTH / 48} showTitle />
                  <View pointerEvents="none" style={styles.sheen} />
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={[styles.plankTop, { backgroundImage: c.shelfTop }]} />
      <View style={[styles.plankLip, { backgroundImage: c.shelfLip }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  toggle: { paddingHorizontal: 16 },
  // Negative margin + zIndex: books stand on the plank's top face rather than behind its back edge.
  covers: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: COVER_GAP / 2, paddingTop: SHELF_HEADROOM, height: SHELF_HEADROOM + COVER_WIDTH * 1.5, marginBottom: -BOOK_OVERLAP, zIndex: 1 },
  // Fixed height so an empty slot is as tall as a book and its lamp sits under the shelf above.
  slot: { flex: 1, height: COVER_WIDTH * 1.5, alignItems: "center" },
  book: { borderRadius: 4, boxShadow: "0 3px 6px rgba(0, 0, 0, 0.5)" },
  pressed: { opacity: 0.7 },
  // Spotlight: a small fixture under the shelf above, its cone of warm light on the back panel, and a sheen on the cover.
  lamp: {
    position: "absolute", top: -SHELF_HEADROOM, width: 20, height: 5,
    borderBottomLeftRadius: 5, borderBottomRightRadius: 5,
    backgroundColor: "#fff3d6", boxShadow: "0 0 10px 3px rgba(255, 214, 140, 0.8)",
  },
  lampOff: { backgroundColor: "#3a2a20", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" },
  glow: {
    position: "absolute", top: -SHELF_HEADROOM, bottom: 0, left: -COVER_GAP / 2, right: -COVER_GAP / 2,
    backgroundImage: "radial-gradient(ellipse farthest-side at 50% 0%, rgba(255, 214, 140, 0.55) 0%, rgba(255, 214, 140, 0.18) 55%, rgba(255, 214, 140, 0) 100%)",
  },
  sheen: {
    position: "absolute", top: 0, bottom: 0, left: 0, right: 0, borderRadius: 4,
    backgroundImage: "linear-gradient(to bottom, rgba(255, 236, 196, 0.28) 0%, rgba(255, 236, 196, 0) 55%)",
  },
  plankTop: { height: PLANK_TOP },
  plankLip: { height: PLANK_LIP },
});
