import { router, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { FlatList, Pressable, SectionList, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BookRow, Cover } from "@/components/book-row";
import { CollectionBar } from "@/components/collection-bar";
import { useCollection } from "@/lib/collection-context";
import { setViewMode, useViewMode, type ViewMode } from "@/lib/collection-view";
import { columnsFor, COVER_GAP, COVER_WIDTH } from "@/lib/cover-grid";
import { buildShelfRows, clothFor, groupByStatus, spineSize, SPINE_GAP, type ShelfRow, type SortKey, type StatusFilter } from "@/lib/shelves";
import { strings } from "@/lib/strings";
import { useColors } from "@/lib/theme";

const SHELF_HEADROOM = 28;
const BOOK_OVERLAP = 5;
const PLANK_TOP = 12;
const PLANK_LIP = 10;
const ROW_HEIGHT = SHELF_HEADROOM + COVER_WIDTH * 1.5 - BOOK_OVERLAP + PLANK_TOP + PLANK_LIP;

const openBook = (volumeId: string) => router.push({ pathname: "/book/[volumeId]", params: { volumeId } });

const VIEWS: { mode: ViewMode; label: string; ios: string; material: string }[] = [
  { mode: "spines", label: strings.collection.showSpines, ios: "books.vertical", material: "library_books" },
  { mode: "covers", label: strings.collection.showCovers, ios: "square.grid.2x2", material: "grid_view" },
  { mode: "list", label: strings.collection.showList, ios: "list.bullet", material: "view_list" },
];

export default function CollectionScreen() {
  const c = useColors();
  const { books } = useCollection();
  const { width } = useWindowDimensions();
  const mode = useViewMode();

  const [listHeight, setListHeight] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  // A spine pulled halfway out; tapping it again opens the book. Any view/filter/sort change puts it back.
  const [pulledId, setPulledId] = useState<string | null>(null);

  const columns = columnsFor(width);
  const groups = useMemo(() => groupByStatus(books, filter, sort), [books, filter, sort]);
  // Pad with empty shelves so the bookcase always fills the screen, however few books there are.
  const rows = useMemo(() => {
    if (mode === "list") return [];
    const filled = buildShelfRows(groups, mode, columns, width - 20, (s, n) => strings.collection.shelfLabel(strings.statuses[s], n));
    const nothing = filled.length === 0;
    while (filled.length * ROW_HEIGHT < listHeight || filled.length === 0) filled.push({ kind: "faces", books: [] });
    if (nothing) filled[0].label = strings.collection.nothingHere;
    return filled;
  }, [groups, mode, columns, width, listHeight]);

  const wooden = mode !== "list";
  // The header is wooden only while shelves are showing (see the tab layout), so the icons follow it.
  const tint = wooden && books.length > 0 ? c.onShelf : c.accent;

  const header = (
    <Tabs.Screen
      options={{
        headerRight: () => (
          <View style={styles.toggle}>
            {VIEWS.map((v) => (
              <Pressable
                key={v.mode}
                onPress={() => {
                  setPulledId(null);
                  setViewMode(v.mode);
                }}
                accessibilityRole="button"
                accessibilityLabel={v.label}
                accessibilityState={{ selected: v.mode === mode }}
                hitSlop={4}
                style={styles.toggleBtn}
              >
                <SymbolView
                  name={{ ios: v.ios as never, android: v.material as never, web: v.material as never }}
                  size={22}
                  tintColor={tint}
                  weight={v.mode === mode ? "bold" : "regular"}
                  fallback={<Text style={{ color: tint, fontWeight: v.mode === mode ? "700" : "400" }}>{v.label}</Text>}
                />
              </Pressable>
            ))}
          </View>
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

  const bar = (
    <CollectionBar
      wooden={wooden}
      filter={filter}
      onFilter={(f) => { setPulledId(null); setFilter(f); }}
      sort={sort}
      onSort={(s) => { setPulledId(null); setSort(s); }}
    />
  );

  if (mode === "list") {
    return (
      <View style={styles.flex}>
        {header}
        {bar}
        <SectionList
          sections={groups.map((g) => ({ title: strings.statuses[g.status], data: g.books }))}
          keyExtractor={(b) => b.volumeId}
          ListEmptyComponent={<Text style={[styles.empty, { color: c.subtle }]}>{strings.collection.nothingHere}</Text>}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.section, { color: c.subtle, backgroundColor: c.bg }]}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <BookRow
              {...item}
              extra={[strings.statuses[item.status], item.rating ? "★".repeat(item.rating) : null].filter(Boolean).join(" · ")}
              onPress={() => openBook(item.volumeId)}
            />
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {header}
      {bar}
      <FlatList
        data={rows}
        style={{ backgroundColor: c.shelfBack }}
        onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
        keyExtractor={(row, i) => `${row.kind}-${row.books[0]?.volumeId ?? "empty"}-${i}`}
        renderItem={({ item: row }) =>
          row.kind === "spines" ? (
            <SpineRow
              row={row}
              pulledId={pulledId}
              onSpine={(id) => (pulledId === id ? openBook(id) : setPulledId(id))}
            />
          ) : (
            <CoverRow row={row} columns={columns} />
          )
        }
      />
    </View>
  );
}

function Plank({ label }: { label?: string }) {
  const c = useColors();
  return (
    <View>
      <View style={[styles.plankTop, { backgroundImage: c.shelfTop }]} />
      <View style={[styles.plankLip, { backgroundImage: c.shelfLip }]} />
      {label ? (
        <View style={[styles.plaque, { backgroundImage: c.brass }]}>
          <Text style={styles.plaqueText}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

function SpineRow({ row, pulledId, onSpine }: { row: ShelfRow; pulledId: string | null; onSpine: (id: string) => void }) {
  const c = useColors();
  const pulledHere = row.books.some((b) => b.volumeId === pulledId);
  return (
    <View style={{ backgroundImage: c.shelfWall }}>
      <View style={styles.spines}>
        {row.books.map((b) => {
          const pulled = b.volumeId === pulledId;
          const { w, h } = spineSize(b.volumeId);
          return (
            <Pressable
              key={b.volumeId}
              onPress={() => onSpine(b.volumeId)}
              accessibilityRole="button"
              accessibilityLabel={strings.collection.bookLabel(b.title, b.authors)}
              style={[
                styles.spine,
                { width: pulled ? COVER_WIDTH : w, height: pulled ? COVER_WIDTH * 1.5 : h, borderRadius: pulled ? 4 : 2, backgroundColor: clothFor(b.volumeId) },
                pulled && styles.pulled,
              ]}
            >
              {pulled ? (
                <Cover title={b.title} uri={b.coverUrl} size={COVER_WIDTH / 48} showTitle />
              ) : (
                <>
                  <View style={[styles.band, { top: 9 }]} />
                  <View style={[styles.band, { bottom: 9 }]} />
                  <Text numberOfLines={1} style={[styles.spineTitle, { width: h - 32 }]}>{b.title}</Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
      <Plank label={pulledHere ? strings.collection.tapAgain : row.label} />
    </View>
  );
}

function CoverRow({ row, columns }: { row: ShelfRow; columns: number }) {
  const c = useColors();
  const books = row.books;
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
      <Plank label={row.label} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  toggle: { flexDirection: "row", paddingRight: 8 },
  toggleBtn: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", marginTop: 32 },
  section: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6, fontSize: 13, textTransform: "uppercase" },
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
  spines: { flexDirection: "row", alignItems: "flex-end", gap: SPINE_GAP, paddingHorizontal: 10, paddingTop: SHELF_HEADROOM, height: SHELF_HEADROOM + COVER_WIDTH * 1.5, marginBottom: -BOOK_OVERLAP, zIndex: 1 },
  spine: { overflow: "hidden", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 3px rgba(0, 0, 0, 0.4)" },
  pulled: { boxShadow: "0 0 22px rgba(255, 214, 140, 0.55), 0 3px 6px rgba(0, 0, 0, 0.5)" },
  band: { position: "absolute", left: 0, right: 0, height: 2, backgroundColor: "rgba(230, 201, 135, 0.7)" },
  // Rotated so the title reads bottom-to-top along the spine, like a real one.
  spineTitle: { textAlign: "center", color: "#f6e7d4", fontSize: 11, fontWeight: "700", transform: [{ rotate: "90deg" }] },
  plaque: { position: "absolute", left: 14, top: 2, height: 18, paddingHorizontal: 8, borderRadius: 2, justifyContent: "center", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" },
  plaqueText: { color: "#2a1a0c", fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  plankTop: { height: PLANK_TOP },
  plankLip: { height: PLANK_LIP },
});
