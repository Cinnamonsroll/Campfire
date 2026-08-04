import { pool } from "../database/client.js";
import type { Db } from "../database/db.js";

export interface Player {
  id: string;
  discord_id: string;
  character_name: string | null;
  level: number;
  xp: number;
  coins: number;
  energy: number;
  last_energy_reset: Date | null;
  total_adventures: number;
  caught_fish: number;
  items_collected: number;
  coins_earned: number;
  coins_spent: number;
  upgrades_purchased: number;
  quests_completed: number;
  created_at: Date;
  updated_at: Date;
}

export async function findByDiscordId(
  discordId: string,
  db: Db = pool,
): Promise<Player | null> {
  const result = await db.query<Player>(
    `SELECT * FROM players WHERE discord_id = $1`,
    [discordId],
  );
  return result.rows[0] ?? null;
}

export async function findById(
  id: string,
  db: Db = pool,
): Promise<Player | null> {
  const result = await db.query<Player>(`SELECT * FROM players WHERE id = $1`, [
    id,
  ]);
  return result.rows[0] ?? null;
}

export async function create(
  discordId: string,
  characterName?: string,
  db: Db = pool,
): Promise<Player> {
  const result = await db.query<Player>(
    `INSERT INTO players (discord_id, character_name) VALUES ($1, $2) RETURNING *`,
    [discordId, characterName ?? null],
  );
  return result.rows[0];
}

export async function updateCharacterName(
  discordId: string,
  name: string,
  db: Db = pool,
): Promise<Player | null> {
  const result = await db.query<Player>(
    `UPDATE players SET character_name = $2, updated_at = NOW() WHERE discord_id = $1 RETURNING *`,
    [discordId, name],
  );
  return result.rows[0] ?? null;
}

export async function update(
  id: string,
  fields: Partial<
    Pick<
      Player,
      | "character_name"
      | "level"
      | "xp"
      | "coins"
      | "energy"
      | "last_energy_reset"
      | "total_adventures"
    >
  >,
  db: Db = pool,
): Promise<Player | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = $${String(paramIndex)}`);
    values.push(value);
    paramIndex++;
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const result = await db.query<Player>(
    `UPDATE players SET ${setClauses.join(", ")} WHERE id = $${String(paramIndex)} RETURNING *`,
    values,
  );
  return result.rows[0] ?? null;
}
