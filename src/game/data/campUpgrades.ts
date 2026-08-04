import type { CampUpgradeDefinition } from "#src/game/types.js";

export const CAMP_UPGRADES: Record<string, CampUpgradeDefinition> = {
  tent: {
    key: "tent",
    name: "Tent",
    description:
      "Your cozy home away from home. Higher levels raise max energy.",
    emoji: "⛺",
    maxLevel: 5,
    levels: [
      {
        costCoins: 100,
        costItems: [{ itemKey: "driftwood", quantity: 2 }],
        effect: "Max Energy 100 → 110",
      },
      {
        costCoins: 200,
        costItems: [{ itemKey: "oak_branch", quantity: 3 }],
        effect: "Max Energy 110 → 120",
      },
      {
        costCoins: 350,
        costItems: [
          { itemKey: "warm_blanket", quantity: 1 },
          { itemKey: "driftwood", quantity: 4 },
        ],
        effect: "Max Energy 120 → 130",
      },
      {
        costCoins: 500,
        costItems: [
          { itemKey: "oak_branch", quantity: 5 },
          { itemKey: "truffle", quantity: 1 },
        ],
        effect: "Max Energy 130 → 140",
      },
    ],
  },
  campfire: {
    key: "campfire",
    name: "Campfire",
    description: "Where every good story begins. Higher levels boost XP.",
    emoji: "🔥",
    maxLevel: 5,
    levels: [
      {
        costCoins: 150,
        costItems: [{ itemKey: "pine_cone", quantity: 3 }],
        effect: "XP Boost +5%",
      },
      {
        costCoins: 250,
        costItems: [{ itemKey: "driftwood", quantity: 3 }],
        effect: "XP Boost +10%",
      },
      {
        costCoins: 400,
        costItems: [{ itemKey: "wild_berries", quantity: 3 }],
        effect: "XP Boost +15%",
      },
      {
        costCoins: 600,
        costItems: [
          { itemKey: "pine_cone", quantity: 5 },
          { itemKey: "pearl", quantity: 1 },
        ],
        effect: "XP Boost +20%",
      },
    ],
  },
  storage: {
    key: "storage",
    name: "Storage",
    description: "Keep your finds safe. Higher levels raise capacity.",
    emoji: "📦",
    maxLevel: 5,
    levels: [
      {
        costCoins: 120,
        costItems: [{ itemKey: "oak_branch", quantity: 2 }],
        effect: "Capacity 40 → 60",
      },
      {
        costCoins: 220,
        costItems: [{ itemKey: "driftwood", quantity: 3 }],
        effect: "Capacity 60 → 80",
      },
      {
        costCoins: 380,
        costItems: [{ itemKey: "oak_branch", quantity: 4 }],
        effect: "Capacity 80 → 100",
      },
      {
        costCoins: 550,
        costItems: [
          { itemKey: "wild_berries", quantity: 4 },
          { itemKey: "sand_dollar", quantity: 2 },
        ],
        effect: "Capacity 100 → 120",
      },
    ],
  },
};
