import type { LootTable } from "../../types.js";

export const RIVER_LOOT_TABLE: LootTable = {
  key: "river",
  entries: [
    { itemKey: "trout", weight: 30, quantity: 1 },
    { itemKey: "river_clay", weight: 25, quantity: 2 },
    { itemKey: "arrowhead", weight: 15, quantity: 1 },
    { itemKey: "gold_nugget", weight: 5, quantity: 1 },
    { itemKey: "wetwood", weight: 25, quantity: 1 },
  ],
};
