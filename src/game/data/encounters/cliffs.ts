import type { EncounterDefinition } from "#src/game/types.js";

export const CLIFFS_ENCOUNTERS: EncounterDefinition[] = [
  {
    key: "cliffs_viewpoint",
    name: "Breathtaking View",
    emoji: "🏞",
    weight: 40,
    flavorText:
      "From this vantage point, the entire coastline unfurls like a painted map below you. The wind whips past, tasting of salt and faraway places.",
    resultText: "🏞 You took in the view from the cliffs!",
    energyCost: 25,
    rewards: {
      xp: 18,
      coins: 0,
      items: [],
    },
  },
  {
    key: "cliffs_nest",
    name: "Seabird Nest",
    emoji: "🥚",
    weight: 35,
    flavorText:
      "A precariously balanced nest holds three speckled eggs, their parents circling overhead. You watch from a respectful distance.",
    resultText: "🥚 You watched over a seabird nest!",
    energyCost: 25,
    rewards: {
      xp: 22,
      coins: 0,
      items: [],
    },
  },
  {
    key: "cliffs_fossil",
    name: "Fossil in the Rock",
    emoji: "🦴",
    weight: 25,
    flavorText:
      "The cliff face has crumbled to reveal an ancient impression in the stone: a creature frozen for millions of years.",
    resultText: "🦴 You uncovered a fossil in the cliff!",
    energyCost: 25,
    rewards: {
      xp: 25,
      coins: 0,
      items: [],
    },
  },
];
