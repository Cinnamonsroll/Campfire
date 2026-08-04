import type { LootTable } from "#src/game/types.js";

export const FESTIVAL_LOOT_TABLE: LootTable = {
  key: "festival",
  entries: [
    { itemKey: "festival_token", weight: 40, quantity: 3 },
    { itemKey: "ribbon", weight: 25, quantity: 1 },
    { itemKey: "firework", weight: 20, quantity: 1 },
    { itemKey: "golden_medal", weight: 10, quantity: 1 },
    { itemKey: "wish_lantern", weight: 5, quantity: 1 },
  ],
};
