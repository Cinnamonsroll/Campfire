import type { EncounterDefinition } from "../../types.js";

export const RIVER_ENCOUNTERS: EncounterDefinition[] = [
  {
    key: "river_ford",
    name: "Rocky Ford",
    emoji: "🪨",
    weight: 40,
    flavorText:
      "Stepping stones cross the rushing water. One wrong step and you'll be soaked, but you make it across, heart racing.",
    resultText: "🪨 You crossed the river without slipping!",
    energyCost: 18,
    rewards: {
      xp: 15,
      coins: 0,
      items: [],
    },
  },
  {
    key: "river_kingfisher",
    name: "Kingfisher Dive",
    emoji: "🐦",
    weight: 35,
    flavorText:
      "A flash of blue streaks down and emerges from the water with a silvery catch. The kingfisher watches you from a branch, triumphant.",
    resultText: "🐦 You watched a kingfisher make its catch!",
    energyCost: 18,
    rewards: {
      xp: 20,
      coins: 0,
      items: [],
    },
  },
  {
    key: "river_arrowhead",
    name: "Arrowhead Find",
    emoji: "⛏",
    weight: 25,
    flavorText:
      "The water has eroded the bank, revealing what looks like a shaped stone. You turn it over: worked, pointed, and old.",
    resultText: "⛏ You uncovered an old arrowhead!",
    energyCost: 18,
    rewards: {
      xp: 25,
      coins: 0,
      items: [],
    },
  },
];
