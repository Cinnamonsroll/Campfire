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
  updateSession,
} from "../session.js";
import {
  ActivityError,
  grantActivityRewards,
  type ActivityRewardResult,
} from "../rewards.js";
import {
  CATCH_ENERGY_COST,
  CATCH_LOCATION_KEYS,
  INSECTS,
  INSECT_POOLS,
  makeSequence,
  type InsectDefinition,
} from "./data.js";

interface CatchSession {
  locationKey: string;
  insectKey: string;
  sequence: string[];
  step: number;
  energyAfter: number;
}

export interface CatchStartResult {
  location: LocationDefinition;
  insect: InsectDefinition;
  sequence: string[];
  energyAfter: number;
}

export interface CatchStepResult {
  status: "correct" | "caught" | "fled";
  step: number;
  sequence: string[];
  sequenceLength: number;
  insect: InsectDefinition;
  location: LocationDefinition;
  energyAfter: number;
  rewards?: ActivityRewardResult;
}

function rollInsect(locationKey: string): InsectDefinition {
  const pool = INSECT_POOLS[locationKey];
  if (pool.length === 0) {
    throw new ActivityError("Nothing is stirring there right now.");
  }
  const insectKey = rollWeighted(
    Object.fromEntries(pool.map((entry) => [entry.insectKey, entry.weight])),
  );
  return INSECTS[insectKey];
}

export async function startCatching(
  player: Player,
  locationKey: string,
): Promise<CatchStartResult> {
  const location = LOCATIONS[locationKey];
  if (!CATCH_LOCATION_KEYS.includes(locationKey)) {
    throw new ActivityError("There's nothing to catch there.");
  }
  if (player.level < location.unlockLevel) {
    throw new ActivityError("You haven't unlocked that spot yet.");
  }
  if (player.energy < CATCH_ENERGY_COST) {
    throw new ActivityError("You're running low on energy to catch.");
  }
  if (await anyActivityInProgress(player.discord_id)) {
    throw new ActivityError("Finish your current activity first.");
  }

  const energyAfter = player.energy - CATCH_ENERGY_COST;
  const insect = rollInsect(locationKey);
  const key = RedisKeys.gameCatch(player.discord_id);
  const session: CatchSession = {
    locationKey,
    insectKey: insect.itemKey,
    sequence: makeSequence(insect.sequenceLength),
    step: 0,
    energyAfter,
  };
  const claimed = await startSession(key, session);
  if (!claimed) {
    throw new ActivityError("You're already chasing something.");
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
        { energy: Math.max(fresh.energy - CATCH_ENERGY_COST, 0) },
        db,
      );
    });
  } catch (error) {
    await clearSession(key);
    throw error;
  }

  return {
    location,
    insect,
    sequence: session.sequence,
    energyAfter,
  };
}

export async function pressDirection(
  player: Player,
  direction: string,
): Promise<CatchStepResult> {
  const key = RedisKeys.gameCatch(player.discord_id);
  const session = await getSession<CatchSession>(key);
  if (!session) {
    throw new ActivityError("The chase is over. Start a new one.");
  }

  const location = LOCATIONS[session.locationKey];
  const insect = INSECTS[session.insectKey];

  const expected = session.sequence[session.step];
  if (expected !== direction) {
    await clearSession(key);
    return {
      status: "fled",
      step: session.step,
      sequence: session.sequence,
      sequenceLength: session.sequence.length,
      insect,
      location,
      energyAfter: session.energyAfter,
    };
  }

  const step = session.step + 1;
  const caught = step >= session.sequence.length;

  if (caught) {
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
        locationKey: session.locationKey,
        xp: insect.xp,
        coins: insect.coins,
        items: [{ itemKey: insect.itemKey, quantity: 1 }],
        energyAfter: session.energyAfter,
        db,
      });
    });
    await clearSession(key);
    return {
      status: "caught",
      step,
      sequence: session.sequence,
      sequenceLength: session.sequence.length,
      insect,
      location,
      energyAfter: session.energyAfter,
      rewards,
    };
  }

  await updateSession(key, { ...session, step });

  return {
    status: "correct",
    step,
    sequence: session.sequence,
    sequenceLength: session.sequence.length,
    insect,
    location,
    energyAfter: session.energyAfter,
  };
}
