import type { Player } from "../../../database/repositories/playerRepository.js";
import { findById } from "../../../database/repositories/playerRepository.js";
import { withTransaction } from "../../../database/transaction.js";
import { LOCATIONS } from "../../data/locations.js";
import type { LocationDefinition } from "../../types.js";
import type { RewardItemGrant } from "../../rewards/rewardService.js";
import { rollLootEntry } from "../loot.js";
import { anyActivityInProgress } from "../session.js";
import {
  ActivityError,
  grantActivityRewards,
  type ActivityRewardResult,
} from "../rewards.js";
import {
  GATHER_ENERGY_COST,
  GATHER_LOCATION_KEYS,
  GATHER_POOLS,
  GATHER_REWARDS,
} from "./data.js";

export interface GatherResult {
  location: LocationDefinition;
  item: RewardItemGrant;
  energyBefore: number;
  energyAfter: number;
  rewards: ActivityRewardResult;
}

export async function gather(
  player: Player,
  locationKey: string,
): Promise<GatherResult> {
  const location = LOCATIONS[locationKey];
  const pool = GATHER_POOLS[locationKey];
  if (!GATHER_LOCATION_KEYS.includes(locationKey)) {
    throw new ActivityError("There's nothing to gather there.");
  }
  if (player.level < location.unlockLevel) {
    throw new ActivityError("You haven't unlocked that spot yet.");
  }
  if (player.energy < GATHER_ENERGY_COST) {
    throw new ActivityError("You're running low on energy to gather.");
  }
  if (await anyActivityInProgress(player.discord_id)) {
    throw new ActivityError("Finish your current activity first.");
  }

  const item: RewardItemGrant = (() => {
    const entry = rollLootEntry(pool);
    return { itemKey: entry.itemKey, quantity: entry.quantity };
  })();

  const energyAfter = player.energy - GATHER_ENERGY_COST;
  const rewards = await withTransaction(async (db) => {
    const fresh = await findById(player.id, db);
    if (!fresh) {
      throw new ActivityError(
        "No camper here yet. Use `/start` to begin your summer.",
      );
    }
    return grantActivityRewards({
      player: fresh,
      discordId: player.discord_id,
      locationKey,
      xp: GATHER_REWARDS.xp,
      coins: GATHER_REWARDS.coins,
      items: [item],
      energyAfter,
      db,
    });
  });

  return {
    location,
    item,
    energyBefore: player.energy,
    energyAfter,
    rewards,
  };
}
