import type { Player } from "../../database/repositories/playerRepository.js";
import type { PlayerCamp } from "../../database/repositories/campRepository.js";
import { findByPlayerId as findCamp } from "../../database/repositories/campRepository.js";
import { countTotal } from "../../database/repositories/inventoryRepository.js";
import { BUILDINGS, COMING_SOON } from "../data/buildings.js";
import { CAMP_UPGRADES } from "../data/campUpgrades.js";
import { ITEMS } from "../data/items.js";
import type {
  CampBuildingKey,
  CampUpgradeCostItem,
  CampUpgradeDefinition,
} from "../types.js";
import type { CampsiteCardData } from "../../images/types/index.js";

export const CAMP_NAME = "Camp Solstice";

const MAX_ENERGY_BASE = 100;
const ENERGY_PER_TENT_LEVEL = 10;
const STORAGE_BASE_CAPACITY = 40;
const STORAGE_PER_STORAGE_LEVEL = 20;
const XP_BOOST_PER_CAMPFIRE_LEVEL = 0.05;

const BUILDING_ORDER: readonly CampBuildingKey[] = [
  "tent",
  "campfire",
  "storage",
];

export function getBuildingLevel(
  camp: PlayerCamp | null,
  key: CampBuildingKey,
): number {
  if (!camp) return 1;
  switch (key) {
    case "tent":
      return camp.tent_level;
    case "campfire":
      return camp.campfire_level;
    case "storage":
      return camp.storage_level;
  }
}

function getCampLevel(camp: PlayerCamp | null): number {
  if (!camp) return 1;
  return camp.tent_level + camp.campfire_level + camp.storage_level - 2;
}

export function getMaxEnergy(tentLevel: number): number {
  return MAX_ENERGY_BASE + (tentLevel - 1) * ENERGY_PER_TENT_LEVEL;
}

export function getStorageCapacity(storageLevel: number): number {
  return STORAGE_BASE_CAPACITY + (storageLevel - 1) * STORAGE_PER_STORAGE_LEVEL;
}

export function getXpMultiplier(campfireLevel: number): number {
  return 1 + (campfireLevel - 1) * XP_BOOST_PER_CAMPFIRE_LEVEL;
}

interface NextUpgradeInfo {
  building: CampUpgradeDefinition;
  currentLevel: number;
  nextLevel: number;
  costCoins: number;
  costItems: CampUpgradeCostItem[];
  effect: string;
}

function getNextUpgrade(
  camp: PlayerCamp | null,
): NextUpgradeInfo | null {
  for (const key of BUILDING_ORDER) {
    const building = CAMP_UPGRADES[key];
    const currentLevel = getBuildingLevel(camp, key);
    if (currentLevel >= building.maxLevel) continue;
    const next = building.levels[currentLevel - 1];
    return {
      building,
      currentLevel,
      nextLevel: currentLevel + 1,
      costCoins: next.costCoins,
      costItems: next.costItems,
      effect: next.effect,
    };
  }
  return null;
}

export function formatUpgradeCost(
  costCoins: number,
  costItems: CampUpgradeCostItem[],
): string {
  const parts = [`${String(costCoins)} Coins`];
  for (const cost of costItems) {
    const item = ITEMS[cost.itemKey];
    parts.push(`${String(cost.quantity)} ${item.name}`);
  }
  return parts.join(" + ");
}

export async function getCampsite(player: Player): Promise<CampsiteCardData> {
  const camp = await findCamp(player.id);
  const tentLevel = getBuildingLevel(camp, "tent");
  const storageLevel = getBuildingLevel(camp, "storage");

  const maxEnergy = getMaxEnergy(tentLevel);
  const used = await countTotal(player.id);
  const capacity = getStorageCapacity(storageLevel);

  const next = getNextUpgrade(camp);

  return {
    characterName: player.character_name ?? "Camper",
    stats: [
      {
        emoji: "⚡",
        label: "Energy",
        value: `${String(player.energy)} / ${String(maxEnergy)}`,
        progress: { current: player.energy, max: maxEnergy },
      },
      { emoji: "🏕", label: "Camp Level", value: String(getCampLevel(camp)) },
      { emoji: "🪙", label: "Coins", value: String(player.coins) },
      {
        emoji: "📦",
        label: "Storage",
        value: `${String(used)} / ${String(capacity)}`,
        progress: { current: used, max: capacity },
      },
    ],
    buildings: [
      ...BUILDINGS.map((building) => ({
        emoji: building.emoji,
        name: building.name,
        level: getBuildingLevel(camp, building.key as CampBuildingKey),
        isLocked: false,
      })),
      ...COMING_SOON.map((building) => ({
        emoji: building.emoji,
        name: building.name,
        level: 0,
        isLocked: true,
      })),
    ],
    upgrade: next
      ? {
          emoji: next.building.emoji,
          name: next.building.name,
          effect: next.effect,
          costCoins: next.costCoins,
          costItems: next.costItems.map((cost) => ({
            emoji: ITEMS[cost.itemKey].emoji,
            name: ITEMS[cost.itemKey].name,
            quantity: cost.quantity,
          })),
        }
      : {
          emoji: "🎉",
          name: "Fully Upgraded",
          effect: "Every building is at its peak.",
          costCoins: 0,
          costItems: [],
        },
  };
}
