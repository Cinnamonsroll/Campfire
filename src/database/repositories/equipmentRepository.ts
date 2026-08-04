import { pool } from "#src/database/client.js";

export interface EquipmentEntry {
  id: string;
  player_id: string;
  item_id: string;
  slot: string;
  durability: number;
  created_at: Date;
}

export async function findByPlayerId(
  playerId: string,
): Promise<EquipmentEntry[]> {
  const result = await pool.query<EquipmentEntry>(
    `SELECT * FROM player_equipment WHERE player_id = $1`,
    [playerId],
  );
  return result.rows;
}

export async function findBySlot(
  playerId: string,
  slot: string,
): Promise<EquipmentEntry | null> {
  const result = await pool.query<EquipmentEntry>(
    `SELECT * FROM player_equipment WHERE player_id = $1 AND slot = $2`,
    [playerId, slot],
  );
  return result.rows[0] ?? null;
}

export async function equip(
  playerId: string,
  itemId: string,
  slot: string,
  durability: number,
): Promise<EquipmentEntry> {
  const result = await pool.query<EquipmentEntry>(
    `INSERT INTO player_equipment (player_id, item_id, slot, durability)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [playerId, itemId, slot, durability],
  );
  return result.rows[0];
}

export async function unequip(playerId: string, slot: string): Promise<void> {
  await pool.query(
    `DELETE FROM player_equipment WHERE player_id = $1 AND slot = $2`,
    [playerId, slot],
  );
}
