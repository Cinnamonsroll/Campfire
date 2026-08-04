import type { EncounterDefinition } from "../game/types.js";

export const MEADOW_ENCOUNTERS: EncounterDefinition[] = [
  {
    key: "meadow_butterflies",
    name: "Butterfly Swarm",
    emoji: "🦋",
    weight: 40,
    flavorText:
      "Hundreds of monarchs rise from the flowers as you pass, swirling around you in an orange cloud before drifting back to the blooms.",
    resultText: "🦋 A swarm of butterflies danced around you!",
    energyCost: 12,
    rewards: {
      xp: 15,
      coins: 0,
      items: [],
    },
  },
  {
    key: "meadow_herbs",
    name: "Wild Herb Patch",
    emoji: "🌿",
    weight: 35,
    flavorText:
      "A cluster of fragrant herbs grows in a sun-dappled hollow. You crush a leaf between your fingers and breathe in mint and sunshine.",
    resultText: "🌿 You found a patch of fragrant herbs!",
    energyCost: 12,
    rewards: {
      xp: 18,
      coins: 0,
      items: [],
    },
  },
  {
    key: "meadow_fox",
    name: "Sunning Fox",
    emoji: "🦊",
    weight: 25,
    flavorText:
      "A red fox lounges on a sun-warmed rock, watching you with lazy golden eyes. It yawns, utterly unimpressed, then slips into the grass.",
    resultText: "🦊 You crossed paths with a sunning fox!",
    energyCost: 12,
    rewards: {
      xp: 22,
      coins: 0,
      items: [],
    },
  },
];
