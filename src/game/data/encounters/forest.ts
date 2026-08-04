import type { EncounterDefinition } from "../../types.js";

export const FOREST_ENCOUNTERS: EncounterDefinition[] = [
  {
    key: "forest_pinecone",
    name: "Pinecone Trail",
    emoji: "🌲",
    weight: 20,
    flavorText:
      "The path winds deeper beneath the pines, where the needles muffle every sound. At your feet, a scattering of pinecones lies dappled in golden light filtering through the canopy.",
    resultText: "🌲 You found a fat, sun-warmed Pinecone!",
    energyCost: 20,
    rewards: {
      xp: 12,
      coins: 0,
      items: [{ itemKey: "pine_cone", quantity: 1 }],
    },
  },
  {
    key: "forest_berries",
    name: "Wild Berry Patch",
    emoji: "🫐",
    weight: 20,
    flavorText:
      "Near an old fallen log, a patch of wild berry bushes bends low with fruit. You pluck a handful, sweet and tart and bursting with juice, and save the rest for later.",
    resultText: "🫐 You gathered a handful of Wild Berries!",
    energyCost: 20,
    rewards: {
      xp: 15,
      coins: 0,
      items: [{ itemKey: "wild_berries", quantity: 2 }],
    },
  },
  {
    key: "forest_fox",
    name: "A Flash of Red",
    emoji: "🦊",
    weight: 20,
    flavorText:
      "The forest holds its breath. Between the trunks, a red fox freezes mid-step, watching you with amber eyes. It holds your gaze for a long moment, then melts back into the undergrowth without a sound.",
    resultText: "🦊 You spotted a wild fox up close!",
    energyCost: 20,
    rewards: {
      xp: 22,
      coins: 0,
      items: [],
    },
  },
  {
    key: "forest_oak_branch",
    name: "Storm's Gift",
    emoji: "🌳",
    weight: 15,
    flavorText:
      "A great oak lies broken across the trail, struck down by last night's storm. One of its branches is strong and straight, thick enough to carve and light enough to carry home.",
    resultText: "🌳 You found a strong Oak Branch!",
    energyCost: 20,
    rewards: {
      xp: 25,
      coins: 0,
      items: [{ itemKey: "oak_branch", quantity: 1 }],
    },
  },
  {
    key: "forest_truffle",
    name: "Hidden Treasure",
    emoji: "🍄",
    weight: 5,
    flavorText:
      "Beneath a tangle of roots, the earth is pushed up in a suspicious mound. You dig with your fingers and uncover it: a dark, fragrant truffle, the forest's rarest gift.",
    resultText: "🍄 You unearthed a rare Truffle!",
    energyCost: 20,
    rewards: {
      xp: 50,
      coins: 0,
      items: [{ itemKey: "truffle", quantity: 1 }],
    },
  },
];
