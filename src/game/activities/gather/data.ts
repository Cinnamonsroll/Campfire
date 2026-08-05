import type { LootEntry } from "../../types.js";
import { BEACH_LOOT_TABLE } from "../../data/lootTables/beach.js";

export const GATHER_ENERGY_COST = 10;

export const GATHER_LOCATION_KEYS: readonly string[] = [
  "beach",
  "forest",
  "mountain",
];

export const GATHER_REWARDS = { xp: 20, coins: 12 };

export const GATHER_POOLS: Record<string, readonly LootEntry[]> = {
  beach: BEACH_LOOT_TABLE.entries,
  forest: [
    { itemKey: "pine_cone", weight: 30, quantity: 1 },
    { itemKey: "wild_berries", weight: 25, quantity: 1 },
    { itemKey: "oak_branch", weight: 20, quantity: 1 },
    { itemKey: "wildflower", weight: 12, quantity: 1 },
    { itemKey: "herbs", weight: 8, quantity: 1 },
    { itemKey: "truffle", weight: 5, quantity: 1 },
  ],
  mountain: [
    { itemKey: "stone", weight: 40, quantity: 1 },
    { itemKey: "iron_ore", weight: 30, quantity: 1 },
    { itemKey: "herbs", weight: 15, quantity: 1 },
    { itemKey: "crystal_shard", weight: 10, quantity: 1 },
    { itemKey: "wildflower", weight: 5, quantity: 1 },
  ],
};
