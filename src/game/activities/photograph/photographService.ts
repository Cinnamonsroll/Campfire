import type { Player } from "../../../database/repositories/playerRepository.js";
import { findById, update as updatePlayer } from "../../../database/repositories/playerRepository.js";
import { withTransaction } from "../../../database/transaction.js";
import { RedisKeys } from "../../../redis/keys.js";
import { LOCATIONS } from "../../data/locations.js";
import type { LocationDefinition } from "../../types.js";
import { rollWeighted } from "../loot.js";
import {
  anyActivityInProgress,
  clearSession,
  getSession,
  startSession,
} from "../session.js";
import {
  ActivityError,
  grantActivityRewards,
  type ActivityRewardResult,
} from "../rewards.js";
import { upsertPhoto } from "../../../database/repositories/wildlifeRepository.js";
import {
  PHOTO_ENERGY_COST,
  PHOTO_LOCATION_KEYS,
  PHOTO_QUALITY_LABEL,
  PHOTO_QUALITY_RANK,
  PHOTO_QUALITY_REWARDS,
  WILDLIFE,
  WILDLIFE_POOLS,
  qualityFromElapsed,
  type PhotoQuality,
  type WildlifeDefinition,
} from "./data.js";

interface PhotoSession {
  locationKey: string;
  wildlifeKey: string;
  appearedAt: number;
  energyAfter: number;
}

export interface PhotoStartResult {
  location: LocationDefinition;
  wildlife: WildlifeDefinition;
  energyAfter: number;
}

export interface PhotoResult {
  quality: PhotoQuality;
  wildlife: WildlifeDefinition;
  location: LocationDefinition;
  energyAfter: number;
  albumUpdated: boolean;
  rewards?: ActivityRewardResult;
}

function rollWildlife(locationKey: string): WildlifeDefinition {
  const pool = WILDLIFE_POOLS[locationKey];
  if (pool.length === 0) {
    throw new ActivityError("No wildlife is stirring there right now.");
  }
  const wildlifeKey = rollWeighted(
    Object.fromEntries(pool.map((entry) => [entry.wildlifeKey, entry.weight])),
  );
  return WILDLIFE[wildlifeKey];
}

export async function startPhotographing(
  player: Player,
  locationKey: string,
): Promise<PhotoStartResult> {
  const location = LOCATIONS[locationKey];
  if (!PHOTO_LOCATION_KEYS.includes(locationKey)) {
    throw new ActivityError("There's nothing to photograph there.");
  }
  if (player.level < location.unlockLevel) {
    throw new ActivityError("You haven't unlocked that spot yet.");
  }
  if (player.energy < PHOTO_ENERGY_COST) {
    throw new ActivityError("You're running low on energy to photograph.");
  }
  if (await anyActivityInProgress(player.discord_id)) {
    throw new ActivityError("Finish your current activity first.");
  }

  const energyAfter = player.energy - PHOTO_ENERGY_COST;
  const wildlife = rollWildlife(locationKey);
  const key = RedisKeys.gamePhoto(player.discord_id);
  const session: PhotoSession = {
    locationKey,
    wildlifeKey: wildlife.key,
    appearedAt: Date.now(),
    energyAfter,
  };
  const claimed = await startSession(key, session);
  if (!claimed) {
    throw new ActivityError("You're already holding the camera up.");
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
        { energy: Math.max(fresh.energy - PHOTO_ENERGY_COST, 0) },
        db,
      );
    });
  } catch (error) {
    await clearSession(key);
    throw error;
  }

  return { location, wildlife, energyAfter };
}

export async function capture(
  player: Player,
): Promise<PhotoResult> {
  const key = RedisKeys.gamePhoto(player.discord_id);
  const session = await getSession<PhotoSession>(key);
  if (!session) {
    throw new ActivityError("The wildlife is gone. Start again.");
  }

  const location = LOCATIONS[session.locationKey];
  const wildlife = WILDLIFE[session.wildlifeKey];

  const quality = qualityFromElapsed(Date.now() - session.appearedAt);
  const { xp, coins } = PHOTO_QUALITY_REWARDS[quality];
  const albumUpdated = quality !== "missed";

  const rewards = await withTransaction(async (db) => {
    const fresh = await findById(player.id, db);
    if (!fresh) {
      throw new ActivityError(
        "No camper here yet. Use `/start` to begin your summer.",
      );
    }

    if (albumUpdated) {
      await upsertPhoto(
        fresh.id,
        wildlife.key,
        session.locationKey,
        PHOTO_QUALITY_RANK[quality],
        PHOTO_QUALITY_LABEL[quality],
        db,
      );
    }

    return grantActivityRewards({
      player: fresh,
      discordId: player.discord_id,
      locationKey: session.locationKey,
      xp,
      coins,
      items: [],
      energyAfter: session.energyAfter,
      db,
    });
  });

  await clearSession(key);

  return {
    quality,
    wildlife,
    location,
    energyAfter: session.energyAfter,
    albumUpdated,
    rewards,
  };
}
