import { pool } from "../../database/client.js";
import type { Db } from "../../database/db.js";
import type { Player } from "../../database/repositories/playerRepository.js";
import { statValueFromPlayer } from "../../database/repositories/statRepository.js";
import { getJournal } from "./journal/index.js";
import {
  STATISTIC_DEFINITIONS,
  type StatisticDefinition,
} from "../data/statistics.js";

interface StatisticValue {
  definition: StatisticDefinition;
  value: number;
}

async function countTrailsUnlocked(
  playerId: string,
  db: Db = pool,
): Promise<number> {
  const result = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM player_location_visits WHERE player_id = $1`,
    [playerId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function recordLocationVisit(
  playerId: string,
  locationKey: string,
  db: Db = pool,
): Promise<void> {
  await db.query(
    `INSERT INTO player_location_visits (player_id, location_key)
     VALUES ($1, $2)
     ON CONFLICT (player_id, location_key) DO NOTHING`,
    [playerId, locationKey],
  );
}

async function journalCompletion(
  playerId: string,
  db: Db = pool,
): Promise<{ discovered: number; total: number }> {
  const entries = await getJournal(playerId, db);
  const discovered = entries.filter((entry) => entry.discovered).length;
  return { discovered, total: entries.length };
}

export async function getStatistics(
  player: Player,
  db: Db = pool,
): Promise<StatisticValue[]> {
  const [trailsUnlocked, journal] = await Promise.all([
    countTrailsUnlocked(player.id, db),
    journalCompletion(player.id, db),
  ]);

  const values: Record<string, number> = {
    adventures: player.total_adventures,
    trails_unlocked: trailsUnlocked,
    caught_fish: statValueFromPlayer("caught_fish", player),
    items_collected: statValueFromPlayer("items_collected", player),
    quests_completed: statValueFromPlayer("quests_completed", player),
    upgrades_purchased: statValueFromPlayer("upgrades_purchased", player),
    journal_completion:
      journal.total > 0
        ? Math.round((journal.discovered / journal.total) * 100)
        : 0,
    coins_earned: statValueFromPlayer("coins_earned", player),
    coins_spent: statValueFromPlayer("coins_spent", player),
  };

  return STATISTIC_DEFINITIONS.map((definition) => ({
    definition,
    value: values[definition.key],
  }));
}
