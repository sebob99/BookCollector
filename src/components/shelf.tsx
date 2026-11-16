import { Pressable, StyleSheet, Text, View } from "react-native";
import { Cover } from "@/components/book-row";
import { COVER_GAP, COVER_WIDTH } from "@/lib/cover-grid";
import { clothFor } from "@/lib/cloth";
import { spineSize, SPINE_GAP, type ShelfRow } from "@/lib/shelves";
import { strings } from "@/lib/strings";
import { useColors } from "@/lib/theme";

const SHELF_HEADROOM = 28;
const BOOK_OVERLAP = 5;
const PLANK_TOP = 12;
const PLANK_LIP = 10;
export const ROW_HEIGHT = SHELF_HEADROOM + COVER_WIDTH * 1.5 - BOOK_OVERLAP + PLANK_TOP + PLANK_LIP;

/** The wooden shelf board. */
export function Plank({ label, onLabel }: { label?: string; onLabel?: () => void }) {
  const c = useColors();
  return (
    <View>
      <View style={[styles.plankTop, { backgroundImage: c.shelfTop }]} />
      <View style={[styles.plankLip, { backgroundImage: c.shelfLip }]} />
      {label ? (
        <Pressable disabled={!onLabel} onPress={onLabel} accessibilityRole={onLabel ? "button" : undefined} style={[styles.plaque, { backgroundImage: c.brass }]}>
          <Text style={styles.plaqueText}>{label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SpineRow({ row, pulledId, onSpine, onLabel }: { row: ShelfRow; pulledId: string | null; onSpine: (id: string) => void; onLabel?: () => void }) {
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
      <Plank label={pulledHere ? strings.collection.tapAgain : row.label} onLabel={onLabel} />
    </View>
  );
}

export function CoverRow({ row, columns, onBook, onLabel }: { row: ShelfRow; columns: number; onBook: (id: string) => void; onLabel?: () => void }) {
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
                  onPress={() => onBook(book.volumeId)}
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
      <Plank label={row.label} onLabel={onLabel} />
    </View>
  );
}

const styles = StyleSheet.create({
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
  // A 90° clockwise rotation, so the title reads top-to-bottom along the spine.
  spineTitle: { textAlign: "center", color: "#f6e7d4", fontSize: 11, fontWeight: "700", transform: [{ rotate: "90deg" }] },
  plaque: { position: "absolute", left: 14, top: 2, height: 18, paddingHorizontal: 8, borderRadius: 2, justifyContent: "center", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" },
  plaqueText: { color: "#2a1a0c", fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  plankTop: { height: PLANK_TOP },
  plankLip: { height: PLANK_LIP },
  // Matches the 8px list gap the Stats screen had between the two plank parts before they shared a wrapper.
});
