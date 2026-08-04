import type { LootTable } from "#/game/types.js";

export const BEACH_LOOT_TABLE: LootTable = {
  key: "beach",
  entries: [
    { itemKey: "seashell", weight: 40, quantity: 1 },
    { itemKey: "sand_dollar", weight: 25, quantity: 1 },
    { itemKey: "driftwood", weight: 20, quantity: 1 },
    { itemKey: "sea_glass", weight: 10, quantity: 1 },
    { itemKey: "pearl", weight: 5, quantity: 1 },
  ],
};
