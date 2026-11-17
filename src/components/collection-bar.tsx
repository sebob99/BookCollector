import { useRef, useState, type ComponentRef } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { STATUS_ORDER } from "@/lib/collection";
import { SORT_KEYS, type SortKey, type StatusFilter } from "@/lib/shelves";
import { strings } from "@/lib/strings";
import { useColors } from "@/lib/theme";

type Props = {
  wooden: boolean;
  filter: StatusFilter;
  onFilter: (f: StatusFilter) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
};

const FILTERS: StatusFilter[] = ["all", ...STATUS_ORDER];

/** Status chips and the sort menu, sitting inside the header (wooden while shelves show). */
export function CollectionBar({ wooden, filter, onFilter, sort, onSort }: Props) {
  const c = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const sortBtn = useRef<ComponentRef<typeof Pressable>>(null);
  const openMenu = () =>
    sortBtn.current?.measureInWindow((x, y, w, h) => setMenuPos({ top: y + h, right: Math.max(8, windowWidth - x - w) }));
  const close = () => setMenuPos(null);
  const ink = wooden ? c.onShelf : c.text;
  const chipOn = wooden ? "#e6c987" : c.accent;
  const onChip = wooden ? "#2a1a0c" : c.onAccent;

  return (
    <View style={styles.bar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.flex}>
        {FILTERS.map((f) => {
          const on = f === filter;
          return (
            <Pressable
              key={f}
              onPress={() => onFilter(f)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[
                styles.chip,
                {
                  backgroundColor: on ? chipOn : wooden ? "rgba(0,0,0,0.3)" : c.card,
                  borderColor: on ? "transparent" : wooden ? "rgba(230,201,135,0.5)" : c.border,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: on ? onChip : ink }]}>
                {f === "all" ? strings.collection.filterAll : strings.statuses[f]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable ref={sortBtn} onPress={openMenu} accessibilityRole="button" accessibilityLabel={strings.collection.sortBy} style={styles.sort}>
        <Text style={[styles.chipText, { color: ink }]}>{strings.collection.sortShort[sort]} ▾</Text>
      </Pressable>

      <Modal transparent visible={menuPos !== null} animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={strings.book.cancel}>
          <View style={[styles.menu, { backgroundColor: c.bg, top: menuPos?.top ?? 0, right: menuPos?.right ?? 0 }]}>
            {SORT_KEYS.map((k) => (
              <Pressable
                key={k}
                onPress={() => {
                  onSort(k);
                  close();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: k === sort }}
                style={[styles.option, { borderBottomColor: c.border }]}
              >
                <Text style={{ color: c.text, fontSize: 16 }}>{strings.collection.sort[k]}</Text>
                <Text style={{ color: c.accent, fontWeight: "700" }}>{k === sort ? "✓" : ""}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { flexDirection: "row", alignItems: "center", paddingBottom: 6 },
  chips: { gap: 6, paddingHorizontal: 16, alignItems: "center" },
  chip: { height: 32, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, justifyContent: "center" },
  chipText: { fontSize: 13, fontWeight: "600" },
  sort: { minHeight: 44, paddingHorizontal: 14, justifyContent: "center" },
  backdrop: { flex: 1 },
  menu: { position: "absolute", width: 210, borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)" },
  option: { height: 46, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth },
});
