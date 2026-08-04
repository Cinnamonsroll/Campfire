import type { EncounterDefinition } from "#/game/types.js";

export const MARSH_ENCOUNTERS: EncounterDefinition[] = [
  {
    key: "marsh_fireflies",
    name: "Firefly Dance",
    emoji: "🪩",
    weight: 40,
    flavorText:
      "Thousands of fireflies blink in synchronized waves across the marsh as dusk settles, turning the water into a mirror of stars.",
    resultText: "🪩 You watched the marsh fireflies dance!",
    energyCost: 20,
    rewards: {
      xp: 18,
      coins: 0,
      items: [],
    },
  },
  {
    key: "marsh_willow",
    name: "Whispering Willows",
    emoji: "🌳",
    weight: 35,
    flavorText:
      "Ancient willow trees drape their vines into the murky water, creating a hidden grove that feels older than the camp itself.",
    resultText: "🌳 You found the hidden willow grove!",
    energyCost: 20,
    rewards: {
      xp: 20,
      coins: 0,
      items: [],
    },
  },
  {
    key: "marsh_frog",
    name: "Chorus of Frogs",
    emoji: "🐸",
    weight: 25,
    flavorText:
      "A cacophony of croaks rises from every direction as you disturb the marsh's residents. The chorus fades only when you stand perfectly still.",
    resultText: "🐸 You serenaded the marsh frogs!",
    energyCost: 20,
    rewards: {
      xp: 15,
      coins: 0,
      items: [],
    },
  },
];
