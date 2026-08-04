import type { LootTable } from "#src/game/types.js";

export const MARSH_LOOT_TABLE: LootTable = {
  key: "marsh",
  entries: [
    { itemKey: "glowing_moss", weight: 30, quantity: 1 },
    { itemKey: "marsh_herb", weight: 25, quantity: 2 },
    { itemKey: "firefly_jar", weight: 20, quantity: 1 },
    { itemKey: "willow_bark", weight: 15, quantity: 1 },
    { itemKey: "peat", weight: 10, quantity: 2 },
  ],
};
