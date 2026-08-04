import type { LootTable } from "#src/game/types.js";

export const MOUNTAIN_LOOT_TABLE: LootTable = {
  key: "mountain",
  entries: [
    { itemKey: "eagle_feather", weight: 25, quantity: 1 },
    { itemKey: "mountain_flower", weight: 20, quantity: 1 },
    { itemKey: "geode", weight: 20, quantity: 1 },
    { itemKey: "sharp_flint", weight: 25, quantity: 2 },
    { itemKey: "summit_gem", weight: 10, quantity: 1 },
  ],
};
