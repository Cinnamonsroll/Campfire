import type { ItemRarity } from "../game/types.js";

export interface InventorySlot {
  emoji: string;
  quantity: number;
}

export interface CardData {
  avatarUrl: string;
  characterName: string;
  title: string;
  coins: number;
  level: number;
  xp: number;
  xpRequired: number;
  inventory: InventorySlot[];
  accentColor?: number | null;
}

export interface StatCardData {
  emoji: string;
  label: string;
  value: string;
  progress?: { current: number; max: number };
}

export interface BuildingCardData {
  emoji: string;
  name: string;
  level: number;
  isLocked: boolean;
}

export interface UpgradeCostItemData {
  emoji: string;
  name: string;
  quantity: number;
}

export interface UpgradeCardData {
  emoji: string;
  name: string;
  effect: string;
  costCoins: number;
  costItems: UpgradeCostItemData[];
}

export interface CampsiteCardData {
  characterName: string;
  stats: StatCardData[];
  buildings: BuildingCardData[];
  upgrade: UpgradeCardData;
}

export interface ShopItemCardData {
  emoji: string;
  name: string;
  description: string;
  flavor: string;
  price: number;
  rarity: ItemRarity;
  remaining: number;
  isEnergyItem: boolean;
}

export interface ShopCardData {
  characterName: string;
  coins: number;
  refreshLabel: string;
  items: ShopItemCardData[];
}

export interface StatisticCardData {
  emoji: string;
  label: string;
  value: number;
  unit: string | null;
}

export interface StatisticsCardData {
  avatarUrl: string;
  characterName: string;
  statistics: readonly StatisticCardData[];
  accentColor?: number | null;
}
