import type { LootTable } from "../game/types.js";

export const MEADOW_LOOT_TABLE: LootTable = {
  key: "meadow",
  entries: [
    { itemKey: "wildflower", weight: 35, quantity: 2 },
    { itemKey: "honeycomb", weight: 25, quantity: 1 },
    { itemKey: "soft_grass", weight: 20, quantity: 3 },
    { itemKey: "rabbit_fur", weight: 15, quantity: 1 },
    { itemKey: "four_leaf_clover", weight: 5, quantity: 1 },
  ],
};
