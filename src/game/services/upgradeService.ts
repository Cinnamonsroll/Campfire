import { pool } from "../database/client.js";
import type { Db } from "../database/db.js";
import {
  create as createCamp,
  findByPlayerId as findCamp,
  updateLevels,
  type PlayerCamp,
} from "../database/repositories/campRepository.js";
import {
  findQuantitiesByItemKeys,
  removeItems,
} from "../database/repositories/inventoryRepository.js";
import { update as updatePlayer } from "../database/repositories/playerRepository.js";
import type { Player } from "../database/repositories/playerRepository.js";
import { addStats } from "../database/repositories/statRepository.js";
import { withTransaction } from "../database/transaction.js";
import { CAMP_UPGRADES } from "../game/data/campUpgrades.js";
import { ITEMS } from "../game/data/items.js";
import { getBuildingLevel } from "../game/services/campService.js";
import type {
  CampBuildingKey,
  CampUpgradeCostItem,
  CampUpgradeDefinition,
} from "../game/types.js";

export type UpgradeErrorKind = "maxed" | "coins" | "items";

export class UpgradeError extends Error {
  readonly kind: UpgradeErrorKind;
  readonly building: CampUpgradeDefinition;
  readonly costCoins: number;
  readonly missingItems: readonly CampUpgradeCostItem[];

  constructor(
    kind: UpgradeErrorKind,
    building: CampUpgradeDefinition,
    costCoins: number,
    missingItems: readonly CampUpgradeCostItem[],
    message: string,
  ) {
    super(message);
    this.name = "UpgradeError";
    this.kind = kind;
    this.building = building;
    this.costCoins = costCoins;
    this.missingItems = missingItems;
  }
}

export interface UpgradeResult {
  building: CampUpgradeDefinition;
  currentLevel: number;
  nextLevel: number;
  effect: string;
  costCoins: number;
  costItems: CampUpgradeCostItem[];
}

export async function getCampRow(
  playerId: string,
  db: Db = pool,
): Promise<PlayerCamp> {
  return (await findCamp(playerId, db)) ?? (await createCamp(playerId, db));
}

function levelField(
  key: CampBuildingKey,
): "tent_level" | "campfire_level" | "storage_level" {
  switch (key) {
    case "tent":
      return "tent_level";
    case "campfire":
      return "campfire_level";
    case "storage":
      return "storage_level";
  }
}

export async function performUpgrade(
  player: Player,
  camp: PlayerCamp | null,
  key: CampBuildingKey,
  db: Db = pool,
): Promise<UpgradeResult> {
  const building = CAMP_UPGRADES[key];

  const campRow = camp ?? (await getCampRow(player.id, db));
  const currentLevel = getBuildingLevel(campRow, key);
  if (currentLevel >= building.maxLevel) {
    throw new UpgradeError(
      "maxed",
      building,
      0,
      [],
      `${building.name} is already maxed out.`,
    );
  }

  const next = building.levels[currentLevel - 1];

  if (player.coins < next.costCoins) {
    throw new UpgradeError(
      "coins",
      building,
      next.costCoins,
      [],
      `You need ${String(next.costCoins)} coins for that upgrade.`,
    );
  }

  const itemKeys = next.costItems.map((cost) => cost.itemKey);
  const owned = await findQuantitiesByItemKeys(player.id, itemKeys, db);
  const ownedByKey = new Map(
    owned.map((entry) => [entry.itemKey, entry.quantity]),
  );
  const missingItems: CampUpgradeCostItem[] = [];
  for (const cost of next.costItems) {
    if ((ownedByKey.get(cost.itemKey) ?? 0) < cost.quantity) {
      missingItems.push(cost);
    }
  }
  if (missingItems.length > 0) {
    const item = ITEMS[missingItems[0].itemKey];
    throw new UpgradeError(
      "items",
      building,
      next.costCoins,
      missingItems,
      `You need ${String(missingItems[0].quantity)} ${item.name} for that upgrade.`,
    );
  }

  const ownedByKeyRow = new Map(owned.map((entry) => [entry.itemKey, entry]));

  const applyUpgrade = async (tx: Db): Promise<void> => {
    await updatePlayer(player.id, { coins: player.coins - next.costCoins }, tx);

    for (const cost of next.costItems) {
      const row = ownedByKeyRow.get(cost.itemKey);
      if (row) {
        await removeItems(
          player.id,
          [{ itemId: row.itemId, quantity: cost.quantity }],
          tx,
        );
      }
    }

    await updateLevels(
      player.id,
      {
        camp_level: campRow.camp_level + 1,
        [levelField(key)]: currentLevel + 1,
      },
      tx,
    );

    await addStats(
      player,
      { coins_spent: next.costCoins, upgrades_purchased: 1 },
      tx,
    );
  };

  if (db === pool) {
    await withTransaction(applyUpgrade);
  } else {
    await applyUpgrade(db);
  }

  player.coins -= next.costCoins;

  return {
    building,
    currentLevel,
    nextLevel: currentLevel + 1,
    effect: next.effect,
    costCoins: next.costCoins,
    costItems: next.costItems,
  };
}
