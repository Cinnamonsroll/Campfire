import type { LootTable } from "../game/types.js";

export const FOREST_LOOT_TABLE: LootTable = {
  key: "forest",
  entries: [
    { itemKey: "pine_cone", weight: 35, quantity: 1 },
    { itemKey: "wild_berries", weight: 25, quantity: 2 },
    { itemKey: "oak_branch", weight: 20, quantity: 1 },
    { itemKey: "moss", weight: 15, quantity: 1 },
    { itemKey: "truffle", weight: 5, quantity: 1 },
  ],
};
