import type { LootEntry } from "../types.js";

export function rollWeighted<T extends string>(
  weights: Record<T, number>,
): T {
  const keys = Object.keys(weights) as T[];
  const total = keys.reduce((sum, key) => sum + weights[key], 0);
  let roll = Math.random() * total;
  for (const key of keys) {
    roll -= weights[key];
    if (roll < 0) return key;
  }
  return keys[keys.length - 1];
}

export function rollLootEntry(entries: readonly LootEntry[]): LootEntry {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll < 0) return entry;
  }
  return entries[entries.length - 1];
}
