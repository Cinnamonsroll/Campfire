import { ENCOUNTER_TABLES } from "./encounters/index.js";
import type { AchievementDefinition } from "../types.js";

export const BEACH_ITEM_KEYS: readonly string[] = [
  "seashell",
  "sand_dollar",
  "driftwood",
  "bluegill",
  "beach_photo",
  "sea_glass",
  "pearl",
];

const discoverableItemKeys = (): string[] => [
  ...new Set(
    Object.values(ENCOUNTER_TABLES).flatMap((table) =>
      table.flatMap((encounter) =>
        encounter.rewards.items.map((reward) => reward.itemKey),
      ),
    ),
  ),
];

export const JOURNAL_ITEM_KEYS: readonly string[] = discoverableItemKeys();

export const ACHIEVEMENTS: Record<string, AchievementDefinition> = {
  first_adventure: {
    key: "first_adventure",
    name: "First Steps",
    description: "Set out on your very first adventure.",
    emoji: "🥾",
    type: "adventure",
    target: 1,
    rewardCoins: 25,
  },
  wanderer: {
    key: "wanderer",
    name: "Wanderer",
    description: "Complete 10 adventures.",
    emoji: "🧭",
    type: "adventure",
    target: 10,
    rewardCoins: 100,
  },
  level_5: {
    key: "level_5",
    name: "Seasoned Camper",
    description: "Reach level 5.",
    emoji: "⭐",
    type: "level",
    target: 5,
    rewardCoins: 75,
  },
  level_10: {
    key: "level_10",
    name: "Trail Master",
    description: "Reach level 10.",
    emoji: "🌟",
    type: "level",
    target: 10,
    rewardCoins: 150,
  },
  level_15: {
    key: "level_15",
    name: "Summit Seeker",
    description: "Reach level 15.",
    emoji: "🏔",
    type: "level",
    target: 15,
    rewardCoins: 250,
  },
  collector_5: {
    key: "collector_5",
    name: "Curious Collector",
    description: "Discover 5 unique items in your journal.",
    emoji: "📔",
    type: "discovery",
    target: 5,
    rewardCoins: 50,
  },
  quest_hero: {
    key: "quest_hero",
    name: "Quest Hero",
    description: "Complete a daily quest.",
    emoji: "📋",
    type: "quest",
    target: 1,
    rewardCoins: 60,
  },
  upgrader: {
    key: "upgrader",
    name: "Home Improver",
    description: "Upgrade a building at camp.",
    emoji: "🔨",
    type: "upgrade",
    target: 1,
    rewardCoins: 60,
  },
  hoarder: {
    key: "hoarder",
    name: "Hoarder",
    description: "Collect 250 items in total.",
    emoji: "📦",
    type: "items_collected",
    target: 250,
    rewardCoins: 200,
  },
  complete_journal: {
    key: "complete_journal",
    name: "Journal Keeper",
    description: "Complete the Journal.",
    emoji: "📓",
    type: "journal",
    target: JOURNAL_ITEM_KEYS.length,
    groupLabel: "Journal",
    rewardCoins: 300,
  },
  complete_beach_journal: {
    key: "complete_beach_journal",
    name: "Tide Watcher",
    description: "Complete the Sunny Beach section of your Journal.",
    emoji: "🏖",
    type: "journal",
    target: BEACH_ITEM_KEYS.length,
    groupLabel: "Sunny Beach",
    itemKeys: [...BEACH_ITEM_KEYS],
    rewardCoins: 150,
  },
};
