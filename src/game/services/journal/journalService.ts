import { pool } from "../database/client.js";
import type { Db } from "../database/db.js";
import {
  addDiscoveries,
  ensureDiscoveryByKeys,
  findPlayerDiscoveries,
} from "../database/repositories/discoveryRepository.js";
import { CATEGORY_INFO, CATEGORY_ORDER } from "../game/data/categories.js";
import { ITEMS } from "../game/data/items.js";
import type { ItemCategory, ItemDefinition } from "../game/types.js";

export interface JournalEntry extends ItemDefinition {
  discovered: boolean;
  foundAt: Date | null;
}

export interface JournalCategoryView {
  readonly category: ItemCategory;
  readonly label: string;
  readonly emoji: string;
  readonly entries: readonly JournalEntry[];
  readonly discovered: number;
}

export interface JournalView {
  readonly ownerName: string;
  readonly totalEntries: number;
  readonly totalDiscovered: number;
  readonly categories: readonly JournalCategoryView[];
}

function compareEntries(a: JournalEntry, b: JournalEntry): number {
  if (a.discovered !== b.discovered) return a.discovered ? -1 : 1;
  if (a.discovered && b.discovered) {
    const aTime = a.foundAt?.getTime() ?? 0;
    const bTime = b.foundAt?.getTime() ?? 0;
    if (aTime !== bTime) return bTime - aTime;
  }
  return a.name.localeCompare(b.name);
}

export async function getJournal(
  playerId: string,
  db: Db = pool,
): Promise<JournalEntry[]> {
  const discoveries = await findPlayerDiscoveries(playerId, db);
  const discoveredAt = new Map(
    discoveries.map((discovery) => [
      discovery.discovery_key,
      discovery.found_at,
    ]),
  );

  return Object.values(ITEMS).map((item) => ({
    ...item,
    discovered: discoveredAt.has(item.key),
    foundAt: discoveredAt.get(item.key) ?? null,
  }));
}

export async function getJournalView(
  playerId: string,
  ownerName: string,
  db: Db = pool,
): Promise<JournalView> {
  const entries = await getJournal(playerId, db);
  const totalDiscovered = entries.filter((entry) => entry.discovered).length;

  const categories: JournalCategoryView[] = [];
  for (const category of CATEGORY_ORDER) {
    const grouped = entries
      .filter((entry) => entry.category === category)
      .sort(compareEntries);
    if (grouped.length === 0) continue;

    const info = CATEGORY_INFO[category];
    categories.push({
      category,
      label: info.label,
      emoji: info.emoji,
      entries: grouped,
      discovered: grouped.filter((entry) => entry.discovered).length,
    });
  }

  return {
    ownerName,
    totalEntries: entries.length,
    totalDiscovered,
    categories,
  };
}

export async function recordDiscoveries(
  playerId: string,
  itemsGranted: { itemKey: string; quantity: number }[],
  db: Db = pool,
): Promise<ItemDefinition[]> {
  const keys = [...new Set(itemsGranted.map((grant) => grant.itemKey))];
  if (keys.length === 0) return [];

  const rows = await ensureDiscoveryByKeys(keys, db);
  const idByKey = new Map(rows.map((row) => [row.discovery_key, row.id]));
  const ids = keys
    .map((key) => idByKey.get(key))
    .filter((id): id is string => id !== undefined);

  const insertedIds = await addDiscoveries(playerId, ids, db);
  const keyById = new Map(rows.map((row) => [row.id, row.discovery_key]));

  return insertedIds
    .map((id) => {
      const key = keyById.get(id);
      return key ? ITEMS[key] : undefined;
    })
    .filter((item): item is ItemDefinition => item !== undefined);
}
