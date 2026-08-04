import { CATEGORY_INFO, CATEGORY_ORDER } from "../../data/categories.js";
import type { ItemCategory } from "../../types.js";
import type {
  InventoryCategoryView,
  InventoryView,
} from "./inventoryService.js";

export const ALL_FILTER = "all";

export type InventoryFilter = "all" | ItemCategory;

export interface InventoryFilterOption {
  readonly value: InventoryFilter;
  readonly emoji: string;
  readonly label: string;
}

const ALL_FILTER_OPTION: InventoryFilterOption = {
  value: ALL_FILTER,
  emoji: "🎒",
  label: "All Items",
};

export function parseInventoryFilter(value: string): InventoryFilter | null {
  if (value === ALL_FILTER) return ALL_FILTER;
  if (CATEGORY_ORDER.includes(value as ItemCategory)) {
    return value as ItemCategory;
  }
  return null;
}

export function buildFilterOptions(
  view: InventoryView,
): readonly InventoryFilterOption[] {
  const presentCategories = new Set(
    view.categories.map((category) => category.category),
  );

  const options: InventoryFilterOption[] = [ALL_FILTER_OPTION];
  for (const category of CATEGORY_ORDER) {
    if (!presentCategories.has(category)) continue;
    const info = CATEGORY_INFO[category];
    options.push({ value: category, emoji: info.emoji, label: info.label });
  }
  return options;
}

export function filterSections(
  view: InventoryView,
  filter: InventoryFilter,
): readonly InventoryCategoryView[] {
  if (filter === ALL_FILTER) {
    return view.categories;
  }
  const section = view.categories.find(
    (category) => category.category === filter,
  );
  return section ? [section] : [];
}
