import { pool } from "../client.js";
import type { Db } from "../db.js";

export interface ShopPurchaseRow {
  id: string;
  player_id: string;
  date: string;
  item_key: string;
  quantity: number;
  price_paid: number;
  created_at: Date;
  updated_at: Date;
}

export async function upsertPurchase(
  playerId: string,
  date: string,
  itemKey: string,
  quantity: number,
  pricePaid: number,
  db: Db = pool,
): Promise<ShopPurchaseRow> {
  const result = await db.query<ShopPurchaseRow>(
    `INSERT INTO shop_purchases (player_id, date, item_key, quantity, price_paid)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (player_id, date, item_key)
     DO UPDATE SET
       quantity = shop_purchases.quantity + EXCLUDED.quantity,
       price_paid = shop_purchases.price_paid + EXCLUDED.price_paid,
       updated_at = NOW()
     RETURNING *`,
    [playerId, date, itemKey, quantity, pricePaid],
  );
  return result.rows[0];
}

export async function findByPlayerIdAndDate(
  playerId: string,
  date: string,
  db: Db = pool,
): Promise<ShopPurchaseRow[]> {
  const result = await db.query<ShopPurchaseRow>(
    `SELECT * FROM shop_purchases
     WHERE player_id = $1 AND date = $2
     ORDER BY created_at ASC`,
    [playerId, date],
  );
  return result.rows;
}
