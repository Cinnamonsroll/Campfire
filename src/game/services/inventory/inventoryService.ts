import { findByPlayerId } from "../database/repositories/inventoryRepository.js";
import { findByIds } from "../database/repositories/itemRepository.js";
import { CATEGORY_INFO, CATEGORY_ORDER } from "../game/data/categories.js";
import { ITEMS } from "../game/data/items.js";
import type { ItemCategory, ItemDefinition } from "../game/types.js";

export interface InventoryItemView {
  readonly itemKey: string;
  readonly name: string;
  readonly emoji: string;
  readonly description: string;
  readonly category: ItemCategory;
  readonly quantity: number;
}

export interface InventoryCategoryView {
  readonly category: ItemCategory;
  readonly label: string;
  readonly emoji: string;
  readonly items: readonly InventoryItemView[];
}

export interface InventoryView {
  readonly ownerName: string;
  readonly totalItems: number;
  readonly categories: readonly InventoryCategoryView[];
}

function getItemDefinition(itemKey: string): ItemDefinition | undefined {
  return ITEMS[itemKey];
}

export async function getInventoryView(
  playerId: string,
  ownerName: string,
): Promise<InventoryView> {
  const entries = await findByPlayerId(playerId);
  if (entries.length === 0) {
    return { ownerName, totalItems: 0, categories: [] };
  }

  const items = await findByIds(entries.map((entry) => entry.item_id));
  const itemKeyByEntryId = new Map(
    items.map((item) => [item.id, item.item_key]),
  );

  const itemsByCategory = new Map<ItemCategory, InventoryItemView[]>();
  let totalItems = 0;

  for (const entry of entries) {
    const itemKey = itemKeyByEntryId.get(entry.item_id);
    if (!itemKey) continue;

    const definition = getItemDefinition(itemKey);
    if (!definition) continue;

    const item: InventoryItemView = {
      itemKey,
      name: definition.name,
      emoji: definition.emoji,
      description: definition.description,
      category: definition.category,
      quantity: entry.quantity,
    };

    const grouped = itemsByCategory.get(definition.category);
    if (grouped) {
      grouped.push(item);
    } else {
      itemsByCategory.set(definition.category, [item]);
    }
    totalItems += entry.quantity;
  }

  const categories: InventoryCategoryView[] = [];
  for (const category of CATEGORY_ORDER) {
    const grouped = itemsByCategory.get(category);
    if (!grouped) continue;

    const info = CATEGORY_INFO[category];
    categories.push({
      category,
      label: info.label,
      emoji: info.emoji,
      items: grouped.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  return { ownerName, totalItems, categories };
}
