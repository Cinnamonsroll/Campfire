import type { LootTable } from "../game/types.js";

export const LAKE_LOOT_TABLE: LootTable = {
  key: "lake",
  entries: [
    { itemKey: "bass", weight: 30, quantity: 1 },
    { itemKey: "lily_flower", weight: 25, quantity: 1 },
    { itemKey: "smooth_pebble", weight: 20, quantity: 2 },
    { itemKey: "fishing_lure", weight: 15, quantity: 1 },
    { itemKey: "ancient_coin", weight: 10, quantity: 1 },
  ],
};
