import { pool } from "../database/client.js";
import type { Db } from "../database/db.js";

export interface Item {
  id: string;
  item_key: string;
  created_at: Date;
}

export async function findByIds(ids: string[], db: Db = pool): Promise<Item[]> {
  if (ids.length === 0) return [];
  const result = await db.query<Item>(
    `SELECT * FROM items WHERE id = ANY($1)`,
    [ids],
  );
  return result.rows;
}

export async function ensureItemsByKeys(
  itemKeys: string[],
  db: Db = pool,
): Promise<Item[]> {
  if (itemKeys.length === 0) return [];
  await db.query(
    `INSERT INTO items (item_key)
     SELECT unnest($1::text[])
     ON CONFLICT (item_key) DO NOTHING`,
    [itemKeys],
  );
  const result = await db.query<Item>(
    `SELECT * FROM items WHERE item_key = ANY($1)`,
    [itemKeys],
  );
  return result.rows;
}
