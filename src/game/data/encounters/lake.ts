import type { EncounterDefinition } from "../game/types.js";

export const LAKE_ENCOUNTERS: EncounterDefinition[] = [
  {
    key: "lake_fishing_spot",
    name: "Quiet Fishing Spot",
    emoji: "🎣",
    weight: 40,
    flavorText:
      "A fallen log juts out over the still water, a perfect place to cast a line. You sit, and the lake keeps its secrets for now.",
    resultText: "🎣 You found a perfect fishing spot!",
    energyCost: 15,
    rewards: {
      xp: 15,
      coins: 0,
      items: [],
    },
  },
  {
    key: "lake_lilypads",
    name: "Lilypad Path",
    emoji: "🪷",
    weight: 35,
    flavorText:
      "A trail of giant lilypads leads toward a small island at the lake's center. A frog launches itself from one, skimming across the surface.",
    resultText: "🪷 You followed the lilypad path!",
    energyCost: 15,
    rewards: {
      xp: 18,
      coins: 0,
      items: [],
    },
  },
  {
    key: "lake_otter",
    name: "Playful Otter",
    emoji: "🦦",
    weight: 25,
    flavorText:
      "An otter pops its head above the surface, clutching a shiny rock before diving away. You watch the water for minutes, hoping it returns.",
    resultText: "🦦 You spotted a playful otter!",
    energyCost: 15,
    rewards: {
      xp: 25,
      coins: 0,
      items: [],
    },
  },
];
