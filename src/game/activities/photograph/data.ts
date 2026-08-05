export const PHOTO_ENERGY_COST = 5;

export const PHOTO_LOCATION_KEYS: readonly string[] = [
  "beach",
  "forest",
  "lake",
  "meadow",
  "waterfall",
  "cliffs",
  "mountain",
];

export type PhotoQuality = "perfect" | "great" | "good" | "missed";

export const PHOTO_QUALITY_EMOJI: Record<PhotoQuality, string> = {
  perfect: "💯",
  great: "👍",
  good: "🙂",
  missed: "😵",
};

export const PHOTO_QUALITY_LABEL: Record<PhotoQuality, string> = {
  perfect: "Perfect",
  great: "Great",
  good: "Good",
  missed: "Missed",
};

export const PHOTO_QUALITY_RANK: Record<PhotoQuality, number> = {
  perfect: 3,
  great: 2,
  good: 1,
  missed: 0,
};

const PHOTO_CAPTURE_WINDOW_MS = 10000;

const PHOTO_QUALITY_TIMING: readonly { quality: PhotoQuality; maxMs: number }[] = [
  { quality: "perfect", maxMs: 2000 },
  { quality: "great", maxMs: 4000 },
  { quality: "good", maxMs: PHOTO_CAPTURE_WINDOW_MS },
];

export const PHOTO_QUALITY_REWARDS: Record<PhotoQuality, { xp: number; coins: number }> = {
  perfect: { xp: 40, coins: 25 },
  great: { xp: 28, coins: 16 },
  good: { xp: 15, coins: 8 },
  missed: { xp: 4, coins: 0 },
};

export interface WildlifeDefinition {
  key: string;
  name: string;
  emoji: string;
  xp: number;
  coins: number;
}

export const WILDLIFE: Record<string, WildlifeDefinition> = {
  fox: { key: "fox", name: "Fox", emoji: "🦊", xp: 30, coins: 20 },
  squirrel: { key: "squirrel", name: "Squirrel", emoji: "🐿️", xp: 20, coins: 12 },
  deer: { key: "deer", name: "Deer", emoji: "🦌", xp: 35, coins: 22 },
  owl: { key: "owl", name: "Owl", emoji: "🦉", xp: 40, coins: 25 },
  duck: { key: "duck", name: "Duck", emoji: "🦆", xp: 20, coins: 12 },
  frog: { key: "frog", name: "Frog", emoji: "🐸", xp: 18, coins: 10 },
  otter: { key: "otter", name: "River Otter", emoji: "🦦", xp: 35, coins: 22 },
  rabbit: { key: "rabbit", name: "Rabbit", emoji: "🐇", xp: 20, coins: 12 },
  hedgehog: { key: "hedgehog", name: "Hedgehog", emoji: "🦔", xp: 25, coins: 15 },
  seagull: { key: "seagull", name: "Seagull", emoji: "🕊️", xp: 18, coins: 10 },
  pelican: { key: "pelican", name: "Pelican", emoji: "🐦", xp: 22, coins: 14 },
  sea_turtle: { key: "sea_turtle", name: "Sea Turtle", emoji: "🐢", xp: 45, coins: 30 },
  kingfisher: { key: "kingfisher", name: "Kingfisher", emoji: "🐦", xp: 30, coins: 18 },
  hummingbird: { key: "hummingbird", name: "Hummingbird", emoji: "🐤", xp: 25, coins: 15 },
  eagle: { key: "eagle", name: "Bald Eagle", emoji: "🦅", xp: 50, coins: 35 },
  puffin: { key: "puffin", name: "Puffin", emoji: "🐧", xp: 30, coins: 18 },
  mountain_goat: { key: "mountain_goat", name: "Mountain Goat", emoji: "🐐", xp: 40, coins: 25 },
};

export const WILDLIFE_POOLS: Record<string, { wildlifeKey: string; weight: number }[]> = {
  beach: [
    { wildlifeKey: "seagull", weight: 45 },
    { wildlifeKey: "pelican", weight: 30 },
    { wildlifeKey: "sea_turtle", weight: 25 },
  ],
  forest: [
    { wildlifeKey: "squirrel", weight: 40 },
    { wildlifeKey: "fox", weight: 30 },
    { wildlifeKey: "deer", weight: 20 },
    { wildlifeKey: "owl", weight: 10 },
  ],
  lake: [
    { wildlifeKey: "duck", weight: 45 },
    { wildlifeKey: "frog", weight: 35 },
    { wildlifeKey: "otter", weight: 20 },
  ],
  meadow: [
    { wildlifeKey: "rabbit", weight: 45 },
    { wildlifeKey: "hedgehog", weight: 30 },
    { wildlifeKey: "deer", weight: 25 },
  ],
  waterfall: [
    { wildlifeKey: "kingfisher", weight: 55 },
    { wildlifeKey: "hummingbird", weight: 45 },
  ],
  cliffs: [
    { wildlifeKey: "puffin", weight: 40 },
    { wildlifeKey: "eagle", weight: 35 },
    { wildlifeKey: "seagull", weight: 25 },
  ],
  mountain: [
    { wildlifeKey: "mountain_goat", weight: 40 },
    { wildlifeKey: "eagle", weight: 35 },
    { wildlifeKey: "fox", weight: 25 },
  ],
};

export function qualityFromElapsed(elapsedMs: number): PhotoQuality {
  for (const timing of PHOTO_QUALITY_TIMING) {
    if (elapsedMs <= timing.maxMs) return timing.quality;
  }
  return "missed";
}
