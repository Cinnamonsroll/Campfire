import { markup } from "#src/utils/markup.js";
import type {
  InventoryCategoryView,
  InventoryItemView,
} from "./inventoryService.js";

export function formatInventoryHeader(ownerName: string): string {
  return `🎒 ${markup.bold(`${ownerName}'s Backpack`)}`;
}

export function formatInventorySubtitle(): string {
  return "Everything you've collected during your adventures.";
}

export function formatCategoryHeader(section: InventoryCategoryView): string {
  return `${section.emoji} ${markup.bold(section.label)}`;
}

export function formatItemLine(item: InventoryItemView): string {
  return `> ${item.emoji} ${markup.bold(item.name)} ×${String(
    item.quantity,
  )}\n> ${item.description}`;
}

export function formatItemLines(items: readonly InventoryItemView[]): string {
  return items.map(formatItemLine).join("\n");
}

export function formatEmptyInventory(ownerName: string): string {
  return `🎒 ${markup.bold(
    `${ownerName}'s backpack is empty.`,
  )}\nTry exploring the beach or forest to discover your first items.`;
}
