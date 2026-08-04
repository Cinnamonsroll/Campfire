import type { EncounterDefinition } from "#/game/types.js";

export const MOUNTAIN_ENCOUNTERS: EncounterDefinition[] = [
  {
    key: "mountain_summit",
    name: "Summit Sunrise",
    emoji: "🌅",
    weight: 40,
    flavorText:
      "At the peak, the first rays of sun paint the world in gold and rose. You can see forever: valleys, lakes, and the camp below, small and distant.",
    resultText: "🌅 You watched the sunrise from the summit!",
    energyCost: 30,
    rewards: {
      xp: 20,
      coins: 0,
      items: [],
    },
  },
  {
    key: "mountain_eagle",
    name: "Soaring Eagle",
    emoji: "🦅",
    weight: 35,
    flavorText:
      "A golden eagle rides thermals above the ridge, scanning the valleys below with piercing eyes. It calls once, and the mountain answers.",
    resultText: "🦅 You watched an eagle soar overhead!",
    energyCost: 30,
    rewards: {
      xp: 22,
      coins: 0,
      items: [],
    },
  },
  {
    key: "mountain_geode",
    name: "Geode Cache",
    emoji: "🪨",
    weight: 25,
    flavorText:
      "A cluster of geodes has been exposed by recent weather, their sparkly interiors winking in the light. The summit keeps its riches close.",
    resultText: "🪨 You found a glittering geode cache!",
    energyCost: 30,
    rewards: {
      xp: 25,
      coins: 0,
      items: [],
    },
  },
];
