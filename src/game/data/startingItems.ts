export const STARTING_ITEM_KEYS = [
  "canvas_backpack",
  "worn_tent",
  "old_fishing_rod",
  "disposable_camera",
] as const;

const STARTING_ITEM_KEY_SET = new Set<string>(STARTING_ITEM_KEYS);

export function isStartingItem(itemKey: string): boolean {
  return STARTING_ITEM_KEY_SET.has(itemKey);
}
