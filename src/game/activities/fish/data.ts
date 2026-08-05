import type { LootEntry } from "../../types.js";

export const FISH_ENERGY_COST = 10;

export const FISH_LOCATION_KEYS: readonly string[] = [
  "beach",
  "lake",
  "waterfall",
];

const FISH_CAST_MIN_MS = 2000;
const FISH_CAST_MAX_MS = 6000;

export type FishQuality = "perfect" | "great" | "good" | "poor";

export const FISH_QUALITY_EMOJI: Record<FishQuality, string> = {
  perfect: "💯",
  great: "👍",
  good: "🙂",
  poor: "😅",
};

export const FISH_QUALITY_LABEL: Record<FishQuality, string> = {
  perfect: "Perfect",
  great: "Great",
  good: "Good",
  poor: "Missed",
};

interface FishQualityTiming {
  quality: FishQuality;
  maxMs: number;
}

const FISH_REEL_TIMING: readonly FishQualityTiming[] = [
  { quality: "perfect", maxMs: 1500 },
  { quality: "great", maxMs: 3000 },
  { quality: "good", maxMs: 6000 },
];

export const FISH_QUALITY_REWARDS: Record<
  FishQuality,
  { xp: number; coins: number }
> = {
  perfect: { xp: 45, coins: 30 },
  great: { xp: 30, coins: 20 },
  good: { xp: 18, coins: 10 },
  poor: { xp: 5, coins: 0 },
};

export const FISH_QUALITY_RARITY: Record<
  FishQuality,
  { common: number; uncommon: number; rare: number }
> = {
  perfect: { common: 10, uncommon: 40, rare: 50 },
  great: { common: 30, uncommon: 50, rare: 20 },
  good: { common: 65, uncommon: 30, rare: 5 },
  poor: { common: 0, uncommon: 0, rare: 0 },
};

interface FishPool {
  common: readonly LootEntry[];
  uncommon: readonly LootEntry[];
  rare: readonly LootEntry[];
}

export const FISH_POOLS: Record<string, FishPool> = {
  beach: {
    common: [
      { itemKey: "bluegill", weight: 50, quantity: 1 },
      { itemKey: "sardine", weight: 35, quantity: 1 },
      { itemKey: "crab", weight: 15, quantity: 1 },
    ],
    uncommon: [
      { itemKey: "flounder", weight: 55, quantity: 1 },
      { itemKey: "sea_glass", weight: 30, quantity: 1 },
      { itemKey: "sunken_bottle", weight: 15, quantity: 1 },
    ],
    rare: [
      { itemKey: "ancient_coin", weight: 50, quantity: 1 },
      { itemKey: "pearl", weight: 30, quantity: 1 },
      { itemKey: "lucky_horseshoe", weight: 20, quantity: 1 },
    ],
  },
  lake: {
    common: [
      { itemKey: "bluegill", weight: 45, quantity: 1 },
      { itemKey: "sunfish", weight: 35, quantity: 1 },
      { itemKey: "minnow", weight: 20, quantity: 1 },
    ],
    uncommon: [
      { itemKey: "bass", weight: 60, quantity: 1 },
      { itemKey: "catfish", weight: 30, quantity: 1 },
      { itemKey: "sunken_bottle", weight: 10, quantity: 1 },
    ],
    rare: [
      { itemKey: "trout", weight: 60, quantity: 1 },
      { itemKey: "ancient_coin", weight: 25, quantity: 1 },
      { itemKey: "lucky_horseshoe", weight: 15, quantity: 1 },
    ],
  },
  waterfall: {
    common: [
      { itemKey: "minnow", weight: 50, quantity: 1 },
      { itemKey: "sunfish", weight: 30, quantity: 1 },
      { itemKey: "sardine", weight: 20, quantity: 1 },
    ],
    uncommon: [
      { itemKey: "trout", weight: 50, quantity: 1 },
      { itemKey: "bass", weight: 35, quantity: 1 },
      { itemKey: "sunken_bottle", weight: 15, quantity: 1 },
    ],
    rare: [
      { itemKey: "salmon", weight: 55, quantity: 1 },
      { itemKey: "ancient_coin", weight: 30, quantity: 1 },
      { itemKey: "lucky_horseshoe", weight: 15, quantity: 1 },
    ],
  },
};

export function qualityFromElapsed(elapsedMs: number): FishQuality {
  for (const timing of FISH_REEL_TIMING) {
    if (elapsedMs <= timing.maxMs) return timing.quality;
  }
  return "poor";
}

export function castDelayMs(): number {
  return (
    FISH_CAST_MIN_MS +
    Math.floor(Math.random() * (FISH_CAST_MAX_MS - FISH_CAST_MIN_MS + 1))
  );
}
