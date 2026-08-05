export const CATCH_ENERGY_COST = 5;

export const CATCH_LOCATION_KEYS: readonly string[] = [
  "beach",
  "forest",
  "lake",
  "meadow",
  "mountain",
  "marsh",
];

export const CATCH_DIRECTIONS: readonly string[] = ["up", "down", "left", "right"];

export const CATCH_DIRECTION_EMOJI: Record<string, string> = {
  up: "⬆️",
  down: "⬇️",
  left: "⬅️",
  right: "➡️",
};

export interface InsectDefinition {
  itemKey: string;
  name: string;
  emoji: string;
  sequenceLength: number;
  xp: number;
  coins: number;
}

export const INSECTS: Record<string, InsectDefinition> = {
  blue_butterfly: {
    itemKey: "blue_butterfly",
    name: "Blue Butterfly",
    emoji: "🦋",
    sequenceLength: 3,
    xp: 20,
    coins: 10,
  },
  field_cricket: {
    itemKey: "field_cricket",
    name: "Field Cricket",
    emoji: "🦗",
    sequenceLength: 3,
    xp: 18,
    coins: 8,
  },
  dragonfly: {
    itemKey: "dragonfly",
    name: "Dragonfly",
    emoji: "💙",
    sequenceLength: 4,
    xp: 28,
    coins: 14,
  },
  stag_beetle: {
    itemKey: "stag_beetle",
    name: "Stag Beetle",
    emoji: "🪲",
    sequenceLength: 4,
    xp: 30,
    coins: 16,
  },
  firefly: {
    itemKey: "firefly",
    name: "Firefly",
    emoji: "✨",
    sequenceLength: 5,
    xp: 40,
    coins: 22,
  },
  night_moth: {
    itemKey: "night_moth",
    name: "Night Moth",
    emoji: "🦋",
    sequenceLength: 5,
    xp: 38,
    coins: 20,
  },
  praying_mantis: {
    itemKey: "praying_mantis",
    name: "Praying Mantis",
    emoji: "🦗",
    sequenceLength: 6,
    xp: 50,
    coins: 30,
  },
};

export const INSECT_POOLS: Record<string, { insectKey: string; weight: number }[]> = {
  beach: [
    { insectKey: "blue_butterfly", weight: 55 },
    { insectKey: "field_cricket", weight: 25 },
    { insectKey: "dragonfly", weight: 15 },
    { insectKey: "night_moth", weight: 5 },
  ],
  forest: [
    { insectKey: "blue_butterfly", weight: 45 },
    { insectKey: "stag_beetle", weight: 25 },
    { insectKey: "firefly", weight: 20 },
    { insectKey: "praying_mantis", weight: 10 },
  ],
  lake: [
    { insectKey: "dragonfly", weight: 45 },
    { insectKey: "blue_butterfly", weight: 30 },
    { insectKey: "field_cricket", weight: 15 },
    { insectKey: "night_moth", weight: 10 },
  ],
  meadow: [
    { insectKey: "blue_butterfly", weight: 50 },
    { insectKey: "field_cricket", weight: 30 },
    { insectKey: "dragonfly", weight: 15 },
    { insectKey: "night_moth", weight: 5 },
  ],
  mountain: [
    { insectKey: "praying_mantis", weight: 35 },
    { insectKey: "stag_beetle", weight: 30 },
    { insectKey: "firefly", weight: 25 },
    { insectKey: "night_moth", weight: 10 },
  ],
  marsh: [
    { insectKey: "firefly", weight: 45 },
    { insectKey: "night_moth", weight: 25 },
    { insectKey: "stag_beetle", weight: 20 },
    { insectKey: "dragonfly", weight: 10 },
  ],
};

export function makeSequence(length: number): string[] {
  const sequence: string[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(
      CATCH_DIRECTIONS[Math.floor(Math.random() * CATCH_DIRECTIONS.length)],
    );
  }
  return sequence;
}
