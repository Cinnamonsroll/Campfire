import type { Db } from "../../database/db.js";
import type { Player } from "../../database/repositories/playerRepository.js";
import { findByPlayerId as findCamp } from "../../database/repositories/campRepository.js";
import { countTotal } from "../../database/repositories/inventoryRepository.js";
import {
  grantRewards,
  StorageFullError,
  type RewardItemGrant,
  type RewardSummary,
} from "../rewards/rewardService.js";
import {
  applyProgression,
  type ProgressionResult,
} from "../services/progressionService.js";
import { recordLocationVisit } from "../services/statsService.js";
import {
  getBuildingLevel,
  getStorageCapacity,
  getXpMultiplier,
} from "../services/campService.js";
import {
  consumeAdventureBuff,
  getBuffXpMultiplier,
} from "../services/buffService.js";

export class ActivityError extends Error {}

export interface ActivityRewardResult {
  summary: RewardSummary;
  progression: ProgressionResult;
}

interface GrantActivityRewardsOptions {
  player: Player;
  discordId: string;
  locationKey: string;
  xp?: number;
  coins?: number;
  items?: RewardItemGrant[];
  energyAfter?: number;
  db: Db;
}

export async function grantActivityRewards(
  options: GrantActivityRewardsOptions,
): Promise<ActivityRewardResult> {
  const {
    player,
    discordId,
    locationKey,
    xp = 0,
    coins = 0,
    items = [],
    energyAfter,
    db,
  } = options;

  const camp = await findCamp(player.id, db);
  const multiplier =
    getXpMultiplier(getBuildingLevel(camp, "campfire")) *
    (await getBuffXpMultiplier(player.id, db));

  let capacity: { used: number; max: number } | undefined;
  if (items.length > 0) {
    capacity = {
      used: await countTotal(player.id, db),
      max: getStorageCapacity(getBuildingLevel(camp, "storage")),
    };
  }

  let summary: RewardSummary;
  try {
    const result = await grantRewards(
      {
        player,
        xp,
        coins,
        items,
        energyAfter,
        xpMultiplier: multiplier,
        capacity,
      },
      db,
    );
    summary = result.summary;
  } catch (error) {
    if (error instanceof StorageFullError) {
      throw new ActivityError(error.message);
    }
    throw error;
  }

  await consumeAdventureBuff(player.id, db);
  await recordLocationVisit(player.id, locationKey, db);

  const progression = await applyProgression(
    player,
    discordId,
    {
      locationKey,
      itemsGranted: items,
      xpGained: summary.xpGained,
      adventures: 1,
    },
    db,
  );

  return { summary, progression };
}
