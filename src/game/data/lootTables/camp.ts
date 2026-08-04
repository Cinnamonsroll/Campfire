import type { LootTable } from "#src/game/types.js";

export const CAMP_LOOT_TABLE: LootTable = {
  key: "camp",
  entries: [
    { itemKey: "camp_story", weight: 50, quantity: 1 },
    { itemKey: "warm_blanket", weight: 30, quantity: 1 },
    { itemKey: "tin_mug", weight: 20, quantity: 1 },
  ],
};
