import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";

export type ViewMode = "covers" | "list";
const VIEW_KEY = "collection.view";

// Shared outside React state because both the Collection screen and the tab layout (for its chrome) read it.
let mode: ViewMode | null = null;
const listeners = new Set<() => void>();

// A broken preference store must not take the Collection down with it: log and use the default.
function getMode(): ViewMode {
  if (mode === null) {
    try {
      mode = Storage.getItemSync(VIEW_KEY) === "list" ? "list" : "covers";
    } catch (e) {
      console.error("Failed to read collection view preference", e);
      mode = "covers";
    }
  }
  return mode;
}

export function setViewMode(next: ViewMode) {
  mode = next;
  listeners.forEach((l) => l());
  try {
    Storage.setItemSync(VIEW_KEY, next);
  } catch (e) {
    console.error("Failed to save collection view preference", e);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export const useViewMode = () => useSyncExternalStore(subscribe, getMode, getMode);
