import { pool } from "../../database/client.js";
import type { Db } from "../../database/db.js";

interface PlayerBuff {
  player_id: string;
  buff_key: string;
  stacks: number;
}

const BUFF_XP_MULTIPLIER: Record<string, number> = {
  camp_stew: 0.15,
};

async function getBuffs(
  playerId: string,
  db: Db = pool,
): Promise<PlayerBuff[]> {
  const result = await db.query<PlayerBuff>(
    `SELECT player_id, buff_key, stacks
     FROM player_buffs
     WHERE player_id = $1 AND stacks > 0`,
    [playerId],
  );
  return result.rows;
}

export async function getBuffXpMultiplier(
  playerId: string,
  db: Db = pool,
): Promise<number> {
  const buffs = await getBuffs(playerId, db);
  return buffs.reduce(
    (multiplier, buff) =>
      multiplier * (1 + (BUFF_XP_MULTIPLIER[buff.buff_key] ?? 0)),
    1,
  );
}

export async function addBuff(
  playerId: string,
  buffKey: string,
  stacks: number,
  db: Db = pool,
): Promise<void> {
  if (stacks <= 0) return;
  await db.query(
    `INSERT INTO player_buffs (player_id, buff_key, stacks)
     VALUES ($1, $2, $3)
     ON CONFLICT (player_id, buff_key)
     DO UPDATE SET
       stacks = player_buffs.stacks + EXCLUDED.stacks,
       updated_at = NOW()`,
    [playerId, buffKey, stacks],
  );
}

export async function consumeAdventureBuff(
  playerId: string,
  db: Db = pool,
): Promise<void> {
  await db.query(
    `UPDATE player_buffs
     SET stacks = stacks - 1, updated_at = NOW()
     WHERE player_id = $1 AND stacks > 0`,
    [playerId],
  );
  await db.query(
    `DELETE FROM player_buffs WHERE player_id = $1 AND stacks <= 0`,
    [playerId],
  );
}
