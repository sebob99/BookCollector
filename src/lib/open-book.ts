import { router } from "expo-router";
import type { GestureResponderEvent } from "react-native";

export type Rect = { x: number; y: number; width: number; height: number };

// The cover the user tapped, so the book screen can fly its cover in from there. Read once, then cleared.
let lift: Rect | null = null;
export const takeLift = () => {
  const r = lift;
  lift = null;
  return r;
};

/** Opens a book; when the tapped view's on-screen rect can be measured, its cover grows from that spot. */
export function openBook(volumeId: string, e?: GestureResponderEvent) {
  const go = () => router.push({ pathname: "/book/[volumeId]", params: { volumeId } });
  const target = e?.currentTarget as unknown as { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void } | undefined;
  if (!target?.measureInWindow) return go();
  target.measureInWindow((x, y, width, height) => {
    lift = width > 0 && height > 0 ? { x, y, width, height } : null;
    go();
  });
}
