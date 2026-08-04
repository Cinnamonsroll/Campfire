export const SCALE = 10;

export const COLORS = {
  body: "#F8F3E8",
  cards: "#EEE2C7",
  text: "#3D3025",
  accent: "#4A90D9",
  badge: "#FF7849",
  barTrack: "#E5D9C4",
  white: "#FFFFFF",
  title: "#E8883E",

  campBody: "#FFF6E3",
  campAccent: "#FF8A5C",
  muted: "#A08060",
  mutedLight: "#A99C88",
  eyebrow: "#C08A5A",
  card: "#FFFDF5",
  upgradeBg: "#FFEFD6",
  lockedBg: "#5D4A38",
  statTrack: "#F1E2C4",

  skyTop: "#FFE8C2",
  skyBottom: "#FFD9A3",
  groundTop: "#CDE7AE",
  groundBottom: "#A8D58A",
  sun: "#FFD873",

  black: "#000000",
  fallback: "#2CB5B4",
} as const;

export function withAlpha(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${String(r)}, ${String(g)}, ${String(b)}, ${String(alpha)})`;
}
