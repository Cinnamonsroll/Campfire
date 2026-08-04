import type { EncounterDefinition } from "../game/types.js";

export const CAVE_ENCOUNTERS: EncounterDefinition[] = [
  {
    key: "cave_echoes",
    name: "Echoing Chamber",
    emoji: "🔊",
    weight: 40,
    flavorText:
      "Every footstep and drip reverberates through a vast chamber whose ceiling is lost in darkness. Your voice comes back to you from somewhere far away.",
    resultText: "🔊 You heard your echo carry across the cavern!",
    energyCost: 28,
    rewards: {
      xp: 15,
      coins: 0,
      items: [],
    },
  },
  {
    key: "cave_crystals",
    name: "Crystal Formation",
    emoji: "💎",
    weight: 35,
    flavorText:
      "The cave wall glitters with sharp, translucent crystals that catch your lantern light, scattering tiny rainbows across the stone.",
    resultText: "💎 You admired the cavern's crystal light!",
    energyCost: 28,
    rewards: {
      xp: 20,
      coins: 0,
      items: [],
    },
  },
  {
    key: "cave_pool",
    name: "Underground Springs",
    emoji: "🫧",
    weight: 25,
    flavorText:
      "A perfectly still pool reflects the crystals above, creating the illusion of infinite depth. You kneel and watch the light dance below the surface.",
    resultText: "🫧 You found the cavern's hidden spring!",
    energyCost: 28,
    rewards: {
      xp: 18,
      coins: 0,
      items: [],
    },
  },
];
