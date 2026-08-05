import type { Player } from "../../../database/repositories/playerRepository.js";
import {
  findById,
  update as updatePlayer,
} from "../../../database/repositories/playerRepository.js";
import { withTransaction } from "../../../database/transaction.js";
import { RedisKeys } from "../../../redis/keys.js";
import { LOCATIONS } from "../../data/locations.js";
import type { LocationDefinition } from "../../types.js";
import type { RewardItemGrant } from "../../rewards/rewardService.js";
import { rollLootEntry, rollWeighted } from "../loot.js";
import {
  anyActivityInProgress,
  clearSession,
  getSession,
  startSession,
  updateSession,
} from "../session.js";
import {
  ActivityError,
  grantActivityRewards,
  type ActivityRewardResult,
} from "../rewards.js";
import {
  FISH_ENERGY_COST,
  FISH_LOCATION_KEYS,
  FISH_POOLS,
  FISH_QUALITY_RARITY,
  FISH_QUALITY_REWARDS,
  qualityFromElapsed,
  type FishQuality,
} from "./data.js";

interface FishSession {
  locationKey: string;
  energyAfter: number;
  biteAt: number;
}

export interface FishReelResult {
  quality: FishQuality;
  caught: RewardItemGrant | null;
  energyBefore: number;
  energyAfter: number;
  location: LocationDefinition;
  rewards: ActivityRewardResult;
}

function rollFish(locationKey: string, quality: FishQuality): RewardItemGrant {
  const pool = FISH_POOLS[locationKey];
  const rarity = rollWeighted(FISH_QUALITY_RARITY[quality]);
  const entry = rollLootEntry(pool[rarity]);
  return { itemKey: entry.itemKey, quantity: entry.quantity };
}

export async function startFishing(
  player: Player,
  locationKey: string,
): Promise<FishSession> {
  const location = LOCATIONS[locationKey];
  if (!FISH_LOCATION_KEYS.includes(locationKey)) {
    throw new ActivityError("Those waters aren't fishable yet.");
  }
  if (player.level < location.unlockLevel) {
    throw new ActivityError("You haven't unlocked those waters yet.");
  }
  if (player.energy < FISH_ENERGY_COST) {
    throw new ActivityError("You're running low on energy to fish.");
  }
  if (await anyActivityInProgress(player.discord_id)) {
    throw new ActivityError("Finish your current activity first.");
  }

  const energyAfter = player.energy - FISH_ENERGY_COST;
  const key = RedisKeys.gameFish(player.discord_id);
  const session: FishSession = { locationKey, energyAfter, biteAt: 0 };
  const claimed = await startSession(key, session);
  if (!claimed) {
    throw new ActivityError("You're already fishing. Reel in your line first.");
  }

  try {
    await withTransaction(async (db) => {
      const fresh = await findById(player.id, db);
      if (!fresh) {
        throw new ActivityError(
          "No camper here yet. Use `/start` to begin your summer.",
        );
      }
      await updatePlayer(
        player.id,
        { energy: Math.max(fresh.energy - FISH_ENERGY_COST, 0) },
        db,
      );
    });
  } catch (error) {
    await clearSession(key);
    throw error;
  }

  return session;
}

export async function markBite(
  player: Player,
  session: FishSession,
): Promise<FishSession> {
  const key = RedisKeys.gameFish(player.discord_id);
  const updated: FishSession = { ...session, biteAt: Date.now() };
  await updateSession(key, updated);
  return updated;
}

export async function reelIn(
  player: Player,
): Promise<FishReelResult> {
  const discordId = player.discord_id;
  const key = RedisKeys.gameFish(discordId);
  const session = await getSession<FishSession>(key);
  if (!session) {
    throw new ActivityError("Your line's gone quiet. Cast again to fish.");
  }

  const location = LOCATIONS[session.locationKey];

  const quality = qualityFromElapsed(Date.now() - session.biteAt);
  const { xp, coins } = FISH_QUALITY_REWARDS[quality];
  const caught =
    quality === "poor" ? null : rollFish(session.locationKey, quality);

  const rewards = await withTransaction(async (db) => {
    const fresh = await findById(player.id, db);
    if (!fresh) {
      throw new ActivityError(
        "No camper here yet. Use `/start` to begin your summer.",
      );
    }
    return grantActivityRewards({
      player: fresh,
      discordId,
      locationKey: session.locationKey,
      xp,
      coins,
      items: caught ? [caught] : [],
      energyAfter: session.energyAfter,
      db,
    });
  });

  await clearSession(key);

  return {
    quality,
    caught,
    energyBefore: session.energyAfter + FISH_ENERGY_COST,
    energyAfter: session.energyAfter,
    location,
    rewards,
  };
}
