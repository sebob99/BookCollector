import { useColorScheme } from "react-native";

// Faint irregular vertical streaks standing in for wood grain on the back panel.
const grain =
  "linear-gradient(to right, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0) 6%, rgba(255,255,255,0.03) 13%, rgba(0,0,0,0.08) 21%, " +
  "rgba(0,0,0,0) 34%, rgba(0,0,0,0.07) 47%, rgba(255,255,255,0.03) 58%, rgba(0,0,0,0.09) 70%, rgba(0,0,0,0) 83%, rgba(0,0,0,0.08) 100%)";

const brass = "linear-gradient(to bottom, #e6c987, #b8914a)";

const light = {
  bg: "#ffffff", card: "#f4f4f5", text: "#111111", subtle: "#666666",
  accent: "#208AEF", onAccent: "#ffffff", border: "#dddddd", danger: "#d33636",
  // Bookcase wood. shelfWall/shelfTop/shelfLip are CSS gradients for the `backgroundImage` style.
  shelfBack: "#54301c",
  shelfWall: `${grain}, linear-gradient(to bottom, #24130a 0%, #472817 30%, #54301c 100%)`,
  shelfTop: "linear-gradient(to bottom, #8a5433 0%, #a56b45 100%)",
  shelfLip: "linear-gradient(to bottom, #b98058 0%, #8f5937 18%, #6b3d24 100%)",
  // Header and tab bar while the shelves are showing, and the text/icon colour on top of them.
  brass,
  shelfChrome: "linear-gradient(to bottom, #a56b45 0%, #6b3d24 100%)", onShelf: "#f6e7d4", onShelfSubtle: "#d9bfa3",
};
const dark: typeof light = {
  bg: "#000000", card: "#1c1c1e", text: "#ffffff", subtle: "#9a9a9f",
  accent: "#4da3ff", onAccent: "#000000", border: "#333333", danger: "#ff6b6b",
  shelfBack: "#3a2114",
  shelfWall: `${grain}, linear-gradient(to bottom, #150b06 0%, #2f1a0f 30%, #3a2114 100%)`,
  shelfTop: "linear-gradient(to bottom, #5f3a23 0%, #74492e 100%)",
  shelfLip: "linear-gradient(to bottom, #86593b 0%, #643d25 18%, #472817 100%)",
  brass,
  shelfChrome: "linear-gradient(to bottom, #74492e 0%, #472817 100%)", onShelf: "#f6e7d4", onShelfSubtle: "#c9ad90",
};

export const useColors = () => (useColorScheme() === "dark" ? dark : light);
