import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SORT_KEYS, STATUS_ORDER, type SortKey, type StatusFilter } from "@/lib/shelves";
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

/** Status chips and the sort menu, sitting directly under the header (wooden while shelves show). */
export function CollectionBar({ wooden, filter, onFilter, sort, onSort }: Props) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const ink = wooden ? c.onShelf : c.text;
  const chipOn = wooden ? "#e6c987" : c.accent;
  const onChip = wooden ? "#2a1a0c" : c.onAccent;

  return (
    <View style={[styles.bar, { backgroundColor: wooden ? c.shelfBack : c.bg, borderBottomColor: wooden ? c.shelfBack : c.border }]}>
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
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={strings.collection.sortBy} style={styles.sort}>
        <Text style={[styles.chipText, { color: ink }]}>{strings.collection.sortShort[sort]} ▾</Text>
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel={strings.book.cancel}>
          <View style={[styles.menu, { backgroundColor: c.bg }]}>
            {SORT_KEYS.map((k) => (
              <Pressable
                key={k}
                onPress={() => {
                  onSort(k);
                  setOpen(false);
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
  bar: { flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 6 },
  chips: { gap: 6, paddingHorizontal: 16, alignItems: "center" },
  chip: { height: 32, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, justifyContent: "center" },
  chipText: { fontSize: 13, fontWeight: "600" },
  sort: { minHeight: 44, paddingHorizontal: 14, justifyContent: "center" },
  backdrop: { flex: 1, alignItems: "flex-end", paddingTop: 120, paddingRight: 12 },
  menu: { width: 210, borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)" },
  option: { height: 46, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth },
});
