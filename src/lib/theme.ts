import { useColorScheme } from "react-native";

const light = {
  bg: "#ffffff", card: "#f4f4f5", text: "#111111", subtle: "#666666",
  accent: "#208AEF", onAccent: "#ffffff", border: "#dddddd", danger: "#d33636",
};
const dark: typeof light = {
  bg: "#000000", card: "#1c1c1e", text: "#ffffff", subtle: "#9a9a9f",
  accent: "#4da3ff", onAccent: "#000000", border: "#333333", danger: "#ff6b6b",
};

export const useColors = () => (useColorScheme() === "dark" ? dark : light);
