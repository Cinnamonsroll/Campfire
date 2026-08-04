import type { EncounterDefinition } from "../game/types.js";

export const WATERFALL_ENCOUNTERS: EncounterDefinition[] = [
  {
    key: "waterfall_mist",
    name: "Refreshing Mist",
    emoji: "🌈",
    weight: 40,
    flavorText:
      "The spray from the falls coats everything in a fine, cool mist that shimmers with rainbows. You stand close enough to feel the roar.",
    resultText: "🌈 You stood in the waterfall's mist!",
    energyCost: 22,
    rewards: {
      xp: 15,
      coins: 0,
      items: [],
    },
  },
  {
    key: "waterfall_cave",
    name: "Behind the Falls",
    emoji: "🕳",
    weight: 35,
    flavorText:
      "A narrow ledge leads behind the cascading water into a hidden chamber. Cool air breathes out of the dark.",
    resultText: "🕳 You slipped behind the falls!",
    energyCost: 22,
    rewards: {
      xp: 20,
      coins: 0,
      items: [],
    },
  },
  {
    key: "waterfall_pool",
    name: "Emerald Pool",
    emoji: "💚",
    weight: 25,
    flavorText:
      "The water plunges into a deep, crystal-clear pool ringed by smooth stones. You can see all the way to the bottom.",
    resultText: "💚 You gazed into the emerald pool!",
    energyCost: 22,
    rewards: {
      xp: 18,
      coins: 0,
      items: [],
    },
  },
];
