import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { Book, BookPatch, Collection } from "./collection";
import type { SearchResult } from "./parse-volumes";
import { openSqliteCollection } from "./sqlite-collection";
import { strings } from "./strings";
import { useColors } from "./theme";

type Value = {
  books: Book[];
  has: (volumeId: string) => boolean;
  add: (r: SearchResult) => Promise<void>;
  update: (volumeId: string, patch: BookPatch) => Promise<void>;
  remove: (volumeId: string) => Promise<void>;
};

const Ctx = createContext<Value | null>(null);

export function useCollection(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCollection must be used inside CollectionProvider");
  return v;
}

export function CollectionProvider({ children }: { children: ReactNode }) {
  const colors = useColors();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    openSqliteCollection()
      .then(async (c) => {
        setBooks(await c.list());
        setCollection(c);
      })
      .catch((e) => {
        console.error("Failed to open collection", e);
        setFailed(true);
      });
  }, []);

  const mutate = useCallback(
    async (fn: (c: Collection) => Promise<unknown>) => {
      if (!collection) return;
      await fn(collection);
      setBooks(await collection.list());
    },
    [collection],
  );

  const value = useMemo<Value>(() => {
    const ids = new Set(books.map((b) => b.volumeId));
    return {
      books,
      has: (id) => ids.has(id),
      add: (r) => mutate((c) => c.add(r)),
      update: (id, patch) => mutate((c) => c.update(id, patch)),
      remove: (id) => mutate((c) => c.remove(id)),
    };
  }, [books, mutate]);

  if (failed || !collection) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        {failed ? <Text style={{ color: colors.text }}>{strings.collection.loadFailed}</Text> : <ActivityIndicator />}
      </View>
    );
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
