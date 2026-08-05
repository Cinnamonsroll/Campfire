export interface StatisticDefinition {
  key: string;
  label: string;
  emoji: string;
  unit: string | null;
  sortOrder: number;
}

export const STATISTIC_DEFINITIONS: readonly StatisticDefinition[] = [
  {
    key: "adventures",
    label: "Adventures",
    emoji: "🥾",
    unit: null,
    sortOrder: 1,
  },
  {
    key: "trails_unlocked",
    label: "Trails Unlocked",
    emoji: "🗺️",
    unit: null,
    sortOrder: 2,
  },
  {
    key: "caught_fish",
    label: "Fish Caught",
    emoji: "🐟",
    unit: null,
    sortOrder: 3,
  },
  {
    key: "items_collected",
    label: "Items Collected",
    emoji: "📦",
    unit: null,
    sortOrder: 4,
  },
  {
    key: "quests_completed",
    label: "Quests Completed",
    emoji: "📋",
    unit: null,
    sortOrder: 5,
  },
  {
    key: "upgrades_purchased",
    label: "Upgrades Bought",
    emoji: "🔨",
    unit: null,
    sortOrder: 6,
  },
  {
    key: "journal_completion",
    label: "Journal",
    emoji: "📔",
    unit: "%",
    sortOrder: 7,
  },
  {
    key: "coins_earned",
    label: "Coins Earned",
    emoji: "🪙",
    unit: null,
    sortOrder: 8,
  },
  {
    key: "coins_spent",
    label: "Coins Spent",
    emoji: "💰",
    unit: null,
    sortOrder: 9,
  },
] as const;
