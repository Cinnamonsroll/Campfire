import type { ItemCategory } from "#src/game/types.js";

export interface CategoryInfo {
  label: string;
  emoji: string;
}

export const CATEGORY_INFO: Record<ItemCategory, CategoryInfo> = {
  material: { label: "Materials", emoji: "🌿" },
  fish: { label: "Fish", emoji: "🐟" },
  collectible: { label: "Collectibles", emoji: "📸" },
  tool: { label: "Tools", emoji: "🧰" },
  special: { label: "Special", emoji: "⭐" },
};

export const CATEGORY_ORDER: readonly ItemCategory[] = [
  "material",
  "fish",
  "collectible",
  "tool",
  "special",
];
