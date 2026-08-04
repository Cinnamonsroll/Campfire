import { pool } from "../client.js";
import type { Db } from "../db.js";

export interface AchievementRow {
  id: string;
  achievement_key: string;
}

export async function ensureAchievementsByKeys(
  achievementKeys: string[],
  db: Db = pool,
): Promise<AchievementRow[]> {
  if (achievementKeys.length === 0) return [];
  await db.query(
    `INSERT INTO achievements (achievement_key)
     SELECT unnest($1::text[])
     ON CONFLICT (achievement_key) DO NOTHING`,
    [achievementKeys],
  );
  const result = await db.query<AchievementRow>(
    `SELECT * FROM achievements WHERE achievement_key = ANY($1)`,
    [achievementKeys],
  );
  return result.rows;
}

export async function findUnlockedKeysByPlayerId(
  playerId: string,
  db: Db = pool,
): Promise<string[]> {
  const result = await db.query<{ achievement_key: string }>(
    `SELECT a.achievement_key
     FROM player_achievements pa
     JOIN achievements a ON a.id = pa.achievement_id
     WHERE pa.player_id = $1`,
    [playerId],
  );
  return result.rows.map((row) => row.achievement_key);
}

export async function addUnlocked(
  playerId: string,
  achievementIds: string[],
  db: Db = pool,
): Promise<string[]> {
  if (achievementIds.length === 0) return [];
  const result = await db.query<{ achievement_id: string }>(
    `INSERT INTO player_achievements (player_id, achievement_id)
     SELECT $1, unnest($2::uuid[])
     ON CONFLICT (player_id, achievement_id) DO NOTHING
     RETURNING achievement_id`,
    [playerId, achievementIds],
  );
  return result.rows.map((row) => row.achievement_id);
}

export async function countUnlockedByPlayerId(
  playerId: string,
  db: Db = pool,
): Promise<number> {
  const result = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM player_achievements WHERE player_id = $1`,
    [playerId],
  );
  return Number(result.rows[0]?.count ?? 0);
}
