import { router, Tabs } from "expo-router";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import { useMemo, useState } from "react";
import { FlatList, Pressable, SectionList, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BookRow } from "@/components/book-row";
import { CollectionBar } from "@/components/collection-bar";
import { CoverRow, ROW_HEIGHT, SpineRow } from "@/components/shelf";
import { useCollection } from "@/lib/collection-context";
import { setViewMode, useViewMode, type ViewMode } from "@/lib/collection-view";
import { columnsFor } from "@/lib/cover-grid";
import { buildShelfRows, groupByStatus, type SortKey, type StatusFilter } from "@/lib/shelves";
import { strings } from "@/lib/strings";
import { useColors } from "@/lib/theme";

const openBook = (volumeId: string) => router.push({ pathname: "/book/[volumeId]", params: { volumeId } });

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
                  name={{ ios: v.ios, android: v.material, web: v.material }}
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
            <CoverRow row={row} columns={columns} onBook={openBook} />
          )
        }
      />
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
});
