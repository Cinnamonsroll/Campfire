import type { LootTable } from "#src/game/types.js";

export const CAVE_LOOT_TABLE: LootTable = {
  key: "cave",
  entries: [
    { itemKey: "crystal_shard", weight: 30, quantity: 1 },
    { itemKey: "bat_wing", weight: 20, quantity: 1 },
    { itemKey: "underground_moss", weight: 20, quantity: 1 },
    { itemKey: "stalactite_fragment", weight: 20, quantity: 1 },
    { itemKey: "ancient_relic", weight: 10, quantity: 1 },
  ],
};
