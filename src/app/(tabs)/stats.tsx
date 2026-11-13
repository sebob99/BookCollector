import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useCollection } from "@/lib/collection-context";
import { clothFor, collectionStats } from "@/lib/shelves";
import { strings } from "@/lib/strings";
import { useColors } from "@/lib/theme";

const BAR_MAX = 86;

export default function StatsScreen() {
  const c = useColors();
  const { books } = useCollection();
  const [now] = useState(Date.now); // ponytail: fixed at mount, so the month bars lag if the app stays open across a month change
  const s = useMemo(() => collectionStats(books, now), [books, now]);

  if (s.total === 0) {
    return <Text style={[styles.empty, { color: c.subtle }]}>{strings.stats.empty}</Text>;
  }

  const maxMonth = Math.max(1, ...s.months.map((m) => m.n));
  const maxRating = Math.max(1, ...s.ratings.map((r) => r.n));
  const heading = (t: string) => <Text style={[styles.heading, { color: c.subtle }]}>{t}</Text>;

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <View style={styles.total}>
        <Text style={[styles.big, { color: c.text }]}>{s.total}</Text>
        <Text style={{ color: c.subtle, fontSize: 16 }}>{strings.stats.total}</Text>
      </View>

      <View style={styles.counts}>
        {s.counts.map((x) => (
          <View key={x.status} style={[styles.count, { backgroundColor: c.card }]}>
            <Text style={[styles.countN, { color: c.text }]}>{x.n}</Text>
            <Text style={{ color: c.subtle, fontSize: 13 }}>{strings.statuses[x.status]}</Text>
          </View>
        ))}
      </View>

      {heading(strings.stats.added)}
      <View style={styles.months}>
        {s.months.map((m, i) => (
          <View key={i} style={styles.month}>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: "600" }}>{m.n}</Text>
            <View style={{ width: "100%", height: m.n ? Math.round((m.n / maxMonth) * BAR_MAX) + 6 : 0, backgroundColor: clothFor(`month-${i}`, 40), borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
          </View>
        ))}
      </View>
      <View style={[styles.plankTop, { backgroundImage: c.shelfTop }]} />
      <View style={[styles.plankLip, { backgroundImage: c.shelfLip }]} />
      <View style={styles.months}>
        {s.months.map((m, i) => (
          <Text key={i} style={[styles.monthLabel, { color: c.subtle }]}>{m.label}</Text>
        ))}
      </View>

      {heading(strings.stats.ratings)}
      {s.ratings.map((r) => (
        <View key={r.stars} style={styles.ratingRow}>
          <Text style={[styles.stars, { color: c.accent }]}>{"★".repeat(r.stars)}</Text>
          <View style={[styles.track, { backgroundColor: c.card }]}>
            <View style={{ height: "100%", width: `${(r.n / maxRating) * 100}%`, borderRadius: 5, backgroundColor: c.accent }} />
          </View>
          <Text style={[styles.ratingN, { color: c.text }]}>{r.n}</Text>
        </View>
      ))}
      {s.unrated ? <Text style={{ color: c.subtle, fontSize: 13 }}>{strings.stats.unrated(s.unrated)}</Text> : null}

      {heading(strings.stats.topAuthors)}
      {s.topAuthors.map((a) => (
        <View key={a.name} style={[styles.author, { borderBottomColor: c.border }]}>
          <Text style={{ color: c.text, fontWeight: "600", flexShrink: 1 }}>{a.name}</Text>
          <Text style={{ color: c.subtle }}>{strings.stats.books(a.count)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 32, gap: 8 },
  empty: { textAlign: "center", marginTop: 32 },
  total: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  big: { fontSize: 56, fontWeight: "700", lineHeight: 60 },
  counts: { flexDirection: "row", gap: 8, marginTop: 8 },
  count: { flex: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  countN: { fontSize: 28, fontWeight: "700" },
  heading: { marginTop: 20, fontSize: 13, textTransform: "uppercase" },
  months: { flexDirection: "row", alignItems: "flex-end", gap: 12, paddingHorizontal: 10, height: undefined },
  month: { flex: 1, alignItems: "center", gap: 4 },
  monthLabel: { flex: 1, textAlign: "center", fontSize: 13 },
  plankTop: { height: 7, borderRadius: 2 },
  plankLip: { height: 5, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stars: { width: 78, fontSize: 15, letterSpacing: 1 },
  track: { flex: 1, height: 10, borderRadius: 5, overflow: "hidden" },
  ratingN: { width: 18, textAlign: "right", fontWeight: "600" },
  author: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
});
