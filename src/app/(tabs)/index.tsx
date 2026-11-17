import { router, Tabs, useFocusEffect } from "expo-router";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, SectionList, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookRow } from "@/components/book-row";
import { CollectionBar } from "@/components/collection-bar";
import { CoverRow, ROW_HEIGHT, SpineRow } from "@/components/shelf";
import { useCollection } from "@/lib/collection-context";
import { setViewMode, useViewMode, type ViewMode } from "@/lib/collection-view";
import { columnsFor } from "@/lib/cover-grid";
import { openBook } from "@/lib/open-book";
import { buildShelfRows, groupByStatus, type SortKey, type StatusFilter } from "@/lib/shelves";
import { strings } from "@/lib/strings";
import { chromeColors, serif, useColors } from "@/lib/theme";


const VIEWS: { mode: ViewMode; label: string; ios: SFSymbol; material: AndroidSymbol }[] = [
  { mode: "spines", label: strings.collection.showSpines, ios: "books.vertical", material: "library_books" },
  { mode: "covers", label: strings.collection.showCovers, ios: "square.grid.2x2", material: "grid_view" },
  { mode: "list", label: strings.collection.showList, ios: "list.bullet", material: "view_list" },
];

export default function CollectionScreen() {
  const c = useColors();
  const { books } = useCollection();
  const { width } = useWindowDimensions();
  const mode = useViewMode();
  const insets = useSafeAreaInsets();

  const [listHeight, setListHeight] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  // A spine pulled halfway out; tapping it again opens the book. It goes back on the shelf on a background tap, any view/filter/sort change, or a tab switch. Opening its book keeps it pulled, so it is still out on return; a removed book is no longer pulled.
  const [pulledId, setPulledId] = useState<string | null>(null);
  const openingBook = useRef(false);
  useFocusEffect(
    useCallback(() => {
      openingBook.current = false;
      return () => {
        if (!openingBook.current) setPulledId(null);
      };
    }, []),
  );
  const stillPulled = books.some((b) => b.volumeId === pulledId) ? pulledId : null;

  const columns = columnsFor(width);
  const groups = useMemo(() => groupByStatus(books, filter, sort), [books, filter, sort]);
  // Pad with empty shelves so the bookcase always fills the screen, however few books there are.
  const rows = useMemo(() => {
    if (mode === "list") return [];
    const filled = buildShelfRows(groups, mode, columns, width - 20, (s, n) => strings.collection.shelfLabel(strings.statuses[s], n));
    const nothing = filled.length === 0;
    while (filled.length * ROW_HEIGHT < listHeight || filled.length === 0) filled.push({ kind: "faces", books: [] });
    if (nothing) filled[0].label = books.length === 0 ? `${strings.collection.empty} ${strings.collection.findBooks}` : strings.collection.nothingHere;
    return filled;
  }, [groups, books.length, mode, columns, width, listHeight]);

  const wooden = mode !== "list";
  // The header is wooden only while shelves are showing (see the tab layout), so the icons follow it.
  const { ink, chipBg, chipLine, onBg, onInk } = chromeColors(c, wooden);

  const empty = books.length === 0;
  const bar = empty ? null : (
    <CollectionBar
      wooden={wooden}
      filter={filter}
      onFilter={(f) => { setPulledId(null); setFilter(f); }}
      sort={sort}
      onSort={(s) => { setPulledId(null); setSort(s); }}
    />
  );

  const header = (
    <Tabs.Screen
      options={{
        // One header: wood (or plain) background, title + view toggle, then chips and sort with no seam.
        header: () => (
          <View
            style={[
              { paddingTop: insets.top },
              wooden ? { backgroundImage: c.shelfChrome } : { backgroundColor: c.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
            ]}
          >
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: ink }]} accessibilityRole="header">
                {strings.tabs.collection}
              </Text>
              <View style={[styles.toggle, { backgroundColor: chipBg, borderColor: chipLine }]}>
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
                    style={[styles.toggleBtn, v.mode === mode && onBg]}
                  >
                    <SymbolView
                      name={{ ios: v.ios, android: v.material, web: v.material }}
                      size={22}
                      tintColor={v.mode === mode ? onInk : ink}
                      weight={v.mode === mode ? "bold" : "regular"}
                      fallback={<Text style={{ color: v.mode === mode ? onInk : ink, fontWeight: v.mode === mode ? "700" : "400" }}>{v.label}</Text>}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
            {bar}
          </View>
        ),
      }}
    />
  );

  if (books.length === 0 && mode === "list") {
    return (
      <View style={styles.center}>
        {header}
        <Text style={{ color: c.subtle }}>{strings.collection.empty}</Text>
        <Pressable onPress={() => router.navigate("/search")} accessibilityRole="button">
          <Text style={{ color: c.accent, padding: 12 }}>{strings.collection.findBooks}</Text>
        </Pressable>
      </View>
    );
  }

  const findBooks = () => router.navigate("/search");

  if (mode === "list") {
    return (
      <View style={styles.flex}>
        {header}
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
      <FlatList
        data={rows}
        style={{ backgroundColor: c.shelfBack }}
        onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
        keyExtractor={(row, i) => `${row.kind}-${row.books[0]?.volumeId ?? "empty"}-${i}`}
        renderItem={({ item: row, index }) => (
          <Pressable accessible={false} onPress={() => setPulledId(null)}>
            {row.kind === "spines" ? (
              <SpineRow
                row={row}
                pulledId={stillPulled}
                onSpine={(id, e) => {
                  if (pulledId !== id) return setPulledId(id);
                  openingBook.current = true;
                  openBook(id, e);
                }}
              />
            ) : (
              <CoverRow row={row} columns={columns} onBook={openBook} onLabel={empty && index === 0 ? findBooks : undefined} />
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  titleRow: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 16 },
  title: { fontFamily: serif, fontSize: 26 },
  toggle: { flexDirection: "row", gap: 2, padding: 2, marginRight: 16, borderWidth: 1, borderRadius: 9 },
  toggleBtn: { width: 42, height: 38, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", marginTop: 32 },
  section: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6, fontSize: 13, textTransform: "uppercase" },
});
