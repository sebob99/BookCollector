import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { strings } from "@/lib/strings";
import { useColors } from "@/lib/theme";

type Props = {
  title: string;
  authors: string[];
  coverUrl: string | null;
  year: number | null;
  onPress: () => void;
  extra?: string;
  right?: ReactNode;
};

export function BookRow({ title, authors, coverUrl, year, onPress, extra, right }: Props) {
  const c = useColors();
  const byline = [authors.length ? authors.join(", ") : strings.book.unknownAuthor, year].filter(Boolean).join(" · ");
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.row, { borderColor: c.border }]}>
      <Cover title={title} uri={coverUrl} />
      <View style={styles.text}>
        <Text numberOfLines={2} style={[styles.title, { color: c.text }]}>{title}</Text>
        <Text numberOfLines={1} style={{ color: c.subtle }}>{byline}</Text>
        {extra ? <Text style={{ color: c.subtle }}>{extra}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

export function Cover({ title, uri, size = 1 }: { title: string; uri: string | null; size?: number }) {
  const c = useColors();
  const box = { width: 48 * size, height: 72 * size, borderRadius: 4 };
  if (uri) return <Image source={{ uri }} style={box} contentFit="cover" accessibilityLabel={`Cover of ${title}`} />;
  return (
    <View style={[box, styles.placeholder, { backgroundColor: c.card }]}>
      <Text style={{ color: c.subtle, fontSize: 20 * size }}>{title.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: "600" },
  placeholder: { alignItems: "center", justifyContent: "center" },
});
