import { redis } from "../../redis/client.js";
import { RedisKeys } from "../../redis/keys.js";
import { LOCATIONS } from "../data/locations.js";
import { ENCOUNTER_TABLES } from "../data/encounters/index.js";
import { rollEncounter } from "../encounters/roll.js";
import {
  findByDiscordId,
  update as updatePlayer,
} from "../../database/repositories/playerRepository.js";
import {
  grantRewards,
  StorageFullError,
  type RewardSummary,
} from "../rewards/rewardService.js";
import { findByPlayerId as findCamp } from "../../database/repositories/campRepository.js";
import { countTotal } from "../../database/repositories/inventoryRepository.js";
import {
  applyProgression,
  type ProgressionResult,
} from "./progressionService.js";
import { recordLocationVisit } from "./statsService.js";
import {
  consumeAdventureBuff,
  getBuffXpMultiplier,
} from "./buffService.js";
import { withTransaction } from "../../database/transaction.js";
import {
  getBuildingLevel,
  getStorageCapacity,
} from "./campService.js";
import type { LocationDefinition, EncounterDefinition } from "../types.js";
import type { Player } from "../../database/repositories/playerRepository.js";

const ADVENTURE_TTL_SECONDS = 900;

export class AdventureError extends Error {}

export interface AdventureResult {
  location: LocationDefinition;
  encounter: EncounterDefinition;
  player: Player;
  energyBefore: number;
  energyAfter: number;
  summary: RewardSummary;
  progression: ProgressionResult;
}

interface AdventureState {
  locationKey: string;
  startedAt: number;
}

function findLocation(locationKey: string): LocationDefinition | undefined {
  return LOCATIONS[locationKey];
}

function findEncounterTable(key: string): EncounterDefinition[] | undefined {
  return ENCOUNTER_TABLES[key];
}

export async function runAdventure(
  discordId: string,
  locationKey: string,
): Promise<AdventureResult> {
  const location = findLocation(locationKey);
  if (!location) {
    throw new AdventureError("That trail doesn't lead anywhere yet.");
  }

  const stateKey = RedisKeys.adventure(discordId);
  const state: AdventureState = { locationKey, startedAt: Date.now() };
  const claimed = await redis.set(stateKey, JSON.stringify(state), {
    NX: true,
    EX: ADVENTURE_TTL_SECONDS,
  });
  if (!claimed) {
    throw new AdventureError(
      "You're already out on the trails. Come back when you're done.",
    );
  }

  try {
    return await withTransaction(async (db) => {
      const player = await findByDiscordId(discordId, db);
      if (!player) {
        throw new AdventureError(
          "No camper here yet. Use `/start` to begin your summer.",
        );
      }

      if (player.level < location.unlockLevel) {
        throw new AdventureError(
          "This trail is still waiting to be discovered. Keep exploring to unlock it.",
        );
      }

      const table = findEncounterTable(location.encounterTable);
      if (!table || table.length === 0) {
        throw new AdventureError(
          "The trail is hushed today. Nothing stirs but the wind.",
        );
      }

      const encounter = rollEncounter(table);

      const energyBefore = player.energy;
      const energyAfter = Math.max(energyBefore - encounter.energyCost, 0);
      player.energy = energyAfter;

      let capacity: { used: number; max: number } | undefined;
      if (encounter.rewards.items.length > 0) {
        const camp = await findCamp(player.id, db);
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
            xp: encounter.rewards.xp,
            coins: encounter.rewards.coins,
            items: encounter.rewards.items,
            energyAfter,
            capacity,
            xpMultiplier: await getBuffXpMultiplier(player.id, db),
          },
          db,
        );
        summary = result.summary;
      } catch (error) {
        if (error instanceof StorageFullError) {
          throw new AdventureError(error.message);
        }
        throw error;
      }

      await consumeAdventureBuff(player.id, db);

      player.total_adventures += 1;
      await updatePlayer(
        player.id,
        {
          total_adventures: player.total_adventures,
        },
        db,
      );
      await recordLocationVisit(player.id, location.key, db);

      const progression = await applyProgression(
        player,
        discordId,
        {
          locationKey: location.key,
          itemsGranted: encounter.rewards.items,
          xpGained: summary.xpGained,
          adventures: 1,
        },
        db,
      );

      return {
        location,
        encounter,
        player,
        energyBefore,
        energyAfter,
        summary,
        progression,
      };
    });
  } finally {
    await redis.del(stateKey);
  }
}
