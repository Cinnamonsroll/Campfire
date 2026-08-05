export type ItemRarity = "common" | "uncommon" | "rare";
export type ItemCategory =
  "material" | "fish" | "collectible" | "tool" | "special";

export interface ItemDefinition {
  key: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: ItemRarity;
  emoji: string;
}

export interface LocationDefinition {
  key: string;
  name: string;
  description: string;
  emoji: string;
  unlockLevel: number;
  energyCost: number;
  encounterTable: string;
  lootTable: string;
  music?: string;
  weather?: ("sunny" | "cloudy" | "rainy")[];
  rewards: {
    fish?: boolean;
    forage?: boolean;
    treasures?: boolean;
    photos?: boolean;
  };
  dangerLevel: number;
  travelMessage: string;
  returnMessage: string;
  unlockText: string;
}

interface EncounterItemReward {
  itemKey: string;
  quantity: number;
}

interface EncounterRewards {
  xp: number;
  coins: number;
  items: EncounterItemReward[];
}

export interface EncounterDefinition {
  key: string;
  name: string;
  emoji: string;
  weight: number;
  flavorText: string;
  resultText: string;
  energyCost: number;
  rewards: EncounterRewards;
}

type QuestType = "collect" | "visit" | "xp" | "adventure";

interface QuestReward {
  xp: number;
  coins: number;
}

export interface QuestDefinition {
  key: string;
  name: string;
  description: string;
  emoji: string;
  type: QuestType;
  targetKey: string | null;
  target: number;
  reward: QuestReward;
}

export interface LootEntry {
  itemKey: string;
  weight: number;
  quantity: number;
}

export interface LootTable {
  key: string;
  entries: LootEntry[];
}

export type CampBuildingKey = "tent" | "campfire" | "storage";

export interface CampUpgradeCostItem {
  itemKey: string;
  quantity: number;
}

interface CampUpgradeLevel {
  costCoins: number;
  costItems: CampUpgradeCostItem[];
  effect: string;
}

export interface CampUpgradeDefinition {
  key: CampBuildingKey;
  name: string;
  description: string;
  emoji: string;
  maxLevel: number;
  levels: CampUpgradeLevel[];
}

type AchievementType =
  | "level"
  | "adventure"
  | "discovery"
  | "quest"
  | "upgrade"
  | "items_collected"
  | "journal";

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  emoji: string;
  type: AchievementType;
  target: number;
  rewardCoins: number;
  /** Label shown for the group this achievement tracks (e.g. "Journal" or "Sunny Beach"). */
  groupLabel?: string;
  /** Item keys this achievement counts toward its target. Omitted = every journal entry. */
  itemKeys?: string[];
}
