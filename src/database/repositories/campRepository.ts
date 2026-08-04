import { pool } from "../database/client.js";
import type { Db } from "../database/db.js";

export interface PlayerCamp {
  player_id: string;
  current_upgrade: string | null;
  camp_level: number;
  tent_level: number;
  campfire_level: number;
  storage_level: number;
  created_at: Date;
}

export async function findByPlayerId(
  playerId: string,
  db: Db = pool,
): Promise<PlayerCamp | null> {
  const result = await db.query<PlayerCamp>(
    `SELECT * FROM player_camp WHERE player_id = $1`,
    [playerId],
  );
  return result.rows[0] ?? null;
}

export async function create(
  playerId: string,
  db: Db = pool,
): Promise<PlayerCamp> {
  const result = await db.query<PlayerCamp>(
    `INSERT INTO player_camp (player_id) VALUES ($1) RETURNING *`,
    [playerId],
  );
  return result.rows[0];
}

export async function updateLevels(
  playerId: string,
  fields: {
    camp_level?: number;
    tent_level?: number;
    campfire_level?: number;
    storage_level?: number;
  },
  db: Db = pool,
): Promise<PlayerCamp | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = $${String(paramIndex)}`);
    values.push(value);
    paramIndex++;
  }

  if (setClauses.length === 0) return findByPlayerId(playerId, db);

  values.push(playerId);
  const result = await db.query<PlayerCamp>(
    `UPDATE player_camp SET ${setClauses.join(", ")} WHERE player_id = $${String(paramIndex)} RETURNING *`,
    values,
  );
  return result.rows[0] ?? null;
}
