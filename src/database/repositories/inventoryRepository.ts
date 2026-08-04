import { pool } from "#/database/client.js";
import type { Db } from "#/database/db.js";

export interface InventoryEntry {
  id: string;
  player_id: string;
  item_id: string;
  quantity: number;
  created_at: Date;
}

export async function findByPlayerId(
  playerId: string,
  db: Db = pool,
): Promise<InventoryEntry[]> {
  const result = await db.query<InventoryEntry>(
    `SELECT * FROM player_inventory WHERE player_id = $1 ORDER BY created_at ASC`,
    [playerId],
  );
  return result.rows;
}

export async function addItems(
  playerId: string,
  entries: { itemId: string; quantity: number }[],
  db: Db = pool,
): Promise<InventoryEntry[]> {
  if (entries.length === 0) return [];

  const values: unknown[] = [];
  const placeholders: string[] = [];
  let paramIndex = 1;

  for (const entry of entries) {
    placeholders.push(
      `($${String(paramIndex)}, $${String(paramIndex + 1)}, $${String(paramIndex + 2)})`,
    );
    values.push(playerId, entry.itemId, entry.quantity);
    paramIndex += 3;
  }

  const result = await db.query<InventoryEntry>(
    `INSERT INTO player_inventory (player_id, item_id, quantity)
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (player_id, item_id)
     DO UPDATE SET quantity = player_inventory.quantity + EXCLUDED.quantity
     RETURNING *`,
    values,
  );
  return result.rows;
}

export async function countTotal(
  playerId: string,
  db: Db = pool,
): Promise<number> {
  const result = await db.query<{ total: string }>(
    `SELECT COALESCE(SUM(quantity), 0) AS total
     FROM player_inventory
     WHERE player_id = $1`,
    [playerId],
  );
  return Number(result.rows[0]?.total ?? 0);
}

export interface ItemQuantity {
  itemId: string;
  itemKey: string;
  quantity: number;
}

export async function findQuantitiesByItemKeys(
  playerId: string,
  itemKeys: string[],
  db: Db = pool,
): Promise<ItemQuantity[]> {
  if (itemKeys.length === 0) return [];
  const result = await db.query<ItemQuantity>(
    `SELECT pi.item_id AS "itemId", i.item_key AS "itemKey", pi.quantity
     FROM player_inventory pi
     JOIN items i ON i.id = pi.item_id
     WHERE pi.player_id = $1 AND i.item_key = ANY($2)
     ORDER BY i.item_key ASC`,
    [playerId, itemKeys],
  );
  return result.rows;
}

export async function removeItems(
  playerId: string,
  entries: { itemId: string; quantity: number }[],
  db: Db = pool,
): Promise<InventoryEntry[]> {
  if (entries.length === 0) return [];

  const result: InventoryEntry[] = [];
  for (const entry of entries) {
    const updated = await db.query<InventoryEntry>(
      `UPDATE player_inventory
       SET quantity = GREATEST(quantity - $3, 0)
       WHERE player_id = $1 AND item_id = $2
       RETURNING *`,
      [playerId, entry.itemId, entry.quantity],
    );
    result.push(...updated.rows);
  }

  await db.query(
    `DELETE FROM player_inventory WHERE player_id = $1 AND quantity <= 0`,
    [playerId],
  );

  return result;
}
