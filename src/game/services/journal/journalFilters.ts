import { CATEGORY_INFO, CATEGORY_ORDER } from "../../data/categories.js";
import type { ItemCategory } from "../../types.js";
import type { JournalCategoryView, JournalView } from "./journalService.js";

export const ALL_FILTER = "all";

export type JournalFilter = "all" | ItemCategory;

export interface JournalFilterOption {
  readonly value: JournalFilter;
  readonly emoji: string;
  readonly label: string;
}

const ALL_FILTER_OPTION: JournalFilterOption = {
  value: ALL_FILTER,
  emoji: "🧭",
  label: "All Discoveries",
};

export function parseJournalFilter(value: string): JournalFilter | null {
  if (value === ALL_FILTER) return ALL_FILTER;
  if (CATEGORY_ORDER.includes(value as ItemCategory)) {
    return value as ItemCategory;
  }
  return null;
}

export function buildFilterOptions(
  view: JournalView,
): readonly JournalFilterOption[] {
  const presentCategories = new Set(
    view.categories.map((category) => category.category),
  );

  const options: JournalFilterOption[] = [ALL_FILTER_OPTION];
  for (const category of CATEGORY_ORDER) {
    if (!presentCategories.has(category)) continue;
    const info = CATEGORY_INFO[category];
    options.push({ value: category, emoji: info.emoji, label: info.label });
  }
  return options;
}

export function filterSections(
  view: JournalView,
  filter: JournalFilter,
): readonly JournalCategoryView[] {
  if (filter === ALL_FILTER) {
    return view.categories;
  }
  const section = view.categories.find(
    (category) => category.category === filter,
  );
  return section ? [section] : [];
}
