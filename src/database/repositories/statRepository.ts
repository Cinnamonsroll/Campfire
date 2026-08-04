import { pool } from "#/database/client.js";
import type { Db } from "#/database/db.js";
import type { Player } from "#/database/repositories/playerRepository.js";

export type PlayerStatField =
  | "caught_fish"
  | "items_collected"
  | "coins_earned"
  | "coins_spent"
  | "upgrades_purchased"
  | "quests_completed";

export type PlayerStatDeltas = Partial<Record<PlayerStatField, number>>;

const STAT_FIELDS: readonly PlayerStatField[] = [
  "caught_fish",
  "items_collected",
  "coins_earned",
  "coins_spent",
  "upgrades_purchased",
  "quests_completed",
];

export async function addStats(
  player: Player,
  deltas: PlayerStatDeltas,
  db: Db = pool,
): Promise<void> {
  const entries = Object.entries(deltas).filter(
    (entry): entry is [PlayerStatField, number] =>
      STAT_FIELDS.includes(entry[0] as PlayerStatField) &&
      typeof entry[1] === "number" &&
      entry[1] > 0,
  );
  if (entries.length === 0) return;

  const playerRecord = player as unknown as Record<string, number>;
  for (const [key, value] of entries) {
    playerRecord[key] += value;
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of entries) {
    setClauses.push(`${key} = ${key} + $${String(paramIndex)}`);
    values.push(value);
    paramIndex++;
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(player.id);

  await db.query<Player>(
    `UPDATE players SET ${setClauses.join(", ")} WHERE id = $${String(paramIndex)}`,
    values,
  );
}

export function statValueFromPlayer(
  field: PlayerStatField,
  player: Player,
): number {
  return (player as unknown as Record<string, number>)[field] ?? 0;
}
