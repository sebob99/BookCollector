import { useColorScheme } from "react-native";

// Faint irregular vertical streaks standing in for wood grain on the back panel.
const grain =
  "linear-gradient(to right, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0) 6%, rgba(255,255,255,0.03) 13%, rgba(0,0,0,0.08) 21%, " +
  "rgba(0,0,0,0) 34%, rgba(0,0,0,0.07) 47%, rgba(255,255,255,0.03) 58%, rgba(0,0,0,0.09) 70%, rgba(0,0,0,0) 83%, rgba(0,0,0,0.08) 100%)";

const brass = "linear-gradient(to bottom, #e6c987, #b8914a)";

const light = {
  bg: "#faf6ef", card: "#f1e9dc", text: "#24130a", subtle: "#6f5a4a",
  accent: "#8a5433", onAccent: "#ffffff", border: "#e0d4c2", danger: "#d33636",
  // Bookcase wood. shelfWall/shelfTop/shelfLip are CSS gradients for the `backgroundImage` style.
  shelfBack: "#54301c",
  shelfWall: `${grain}, linear-gradient(to bottom, #24130a 0%, #472817 30%, #54301c 100%)`,
  shelfTop: "linear-gradient(to bottom, #8a5433 0%, #a56b45 100%)",
  shelfLip: "linear-gradient(to bottom, #b98058 0%, #8f5937 18%, #6b3d24 100%)",
  // Header and tab bar while the shelves are showing, and the text/icon colour on top of them.
  brass,
  shelfChrome: "linear-gradient(to bottom, #a56b45 0%, #6b3d24 100%)", onShelf: "#f6e7d4", onShelfSubtle: "#e6d2bb",
};
const dark: typeof light = {
  bg: "#17100b", card: "#261a12", text: "#f6e7d4", subtle: "#c9ad90",
  accent: "#d9a878", onAccent: "#24130a", border: "#3a2a20", danger: "#ff6b6b",
  shelfBack: "#3a2114",
  shelfWall: `${grain}, linear-gradient(to bottom, #150b06 0%, #2f1a0f 30%, #3a2114 100%)`,
  shelfTop: "linear-gradient(to bottom, #5f3a23 0%, #74492e 100%)",
  shelfLip: "linear-gradient(to bottom, #86593b 0%, #643d25 18%, #472817 100%)",
  brass,
  shelfChrome: "linear-gradient(to bottom, #74492e 0%, #472817 100%)", onShelf: "#f6e7d4", onShelfSubtle: "#d9c2a8",
};

export const serif = "LibreCaslonText_700Bold";

/** Ink, chip and selected-segment colours for the header, which is wood while shelves show and paper otherwise. */
export function chromeColors(c: typeof light, wooden: boolean) {
  return {
    ink: wooden ? c.onShelf : c.text,
    chipBg: wooden ? "rgba(0,0,0,0.3)" : c.card,
    chipLine: wooden ? "rgba(230,201,135,0.5)" : c.border,
    onBg: wooden ? { backgroundImage: c.brass } : { backgroundColor: c.accent },
    onInk: wooden ? "#2a1a0c" : c.onAccent,
  };
}

export const useColors = () => (useColorScheme() === "dark" ? dark : light);
