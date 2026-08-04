import { pool } from "#/database/client.js";
import type { Db } from "#/database/db.js";

export type TradeStatus =
  "pending" | "accepted" | "declined" | "cancelled" | "completed";

export interface Trade {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: TradeStatus;
  sender_ready: boolean;
  receiver_ready: boolean;
  expires_at: Date;
  message_id: string | null;
  channel_id: string | null;
  created_at: Date;
}

/** Item quantities keyed by item key — offers are fungible per item key. */
export type TradeItems = Record<string, number>;

export interface TradeOffer {
  trade_id: string;
  player_id: string;
  coins: number;
  items: TradeItems;
}

function parseItems(items: unknown): TradeItems {
  if (items && typeof items === "object" && !Array.isArray(items)) {
    return items as TradeItems;
  }
  return {};
}

function mapOffer(row: {
  trade_id: string;
  player_id: string;
  coins: number;
  items: unknown;
}): TradeOffer {
  return {
    trade_id: row.trade_id,
    player_id: row.player_id,
    coins: row.coins,
    items: parseItems(row.items),
  };
}

export async function findById(
  id: string,
  db: Db = pool,
): Promise<Trade | null> {
  const result = await db.query<Trade>(`SELECT * FROM trades WHERE id = $1`, [
    id,
  ]);
  return result.rows[0] ?? null;
}

export async function findByPlayerId(
  playerId: string,
  db: Db = pool,
): Promise<Trade[]> {
  const result = await db.query<Trade>(
    `SELECT * FROM trades WHERE sender_id = $1 OR receiver_id = $1 ORDER BY created_at DESC`,
    [playerId],
  );
  return result.rows;
}

export async function findActiveBetween(
  senderId: string,
  receiverId: string,
  db: Db = pool,
): Promise<Trade | null> {
  const result = await db.query<Trade>(
    `SELECT * FROM trades
     WHERE status IN ('pending', 'accepted') AND expires_at > NOW()
       AND ((sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1))
     LIMIT 1`,
    [senderId, receiverId],
  );
  return result.rows[0] ?? null;
}

export async function create(
  senderId: string,
  receiverId: string,
  db: Db = pool,
): Promise<Trade> {
  const result = await db.query<Trade>(
    `INSERT INTO trades (sender_id, receiver_id, status)
     VALUES ($1, $2, 'pending') RETURNING *`,
    [senderId, receiverId],
  );
  return result.rows[0];
}

export async function setMessageRef(
  id: string,
  messageId: string,
  channelId: string,
  db: Db = pool,
): Promise<Trade | null> {
  const result = await db.query<Trade>(
    `UPDATE trades SET message_id = $1, channel_id = $2 WHERE id = $3 RETURNING *`,
    [messageId, channelId, id],
  );
  return result.rows[0] ?? null;
}

export async function setReady(
  id: string,
  playerId: string,
  ready: boolean,
  db: Db = pool,
): Promise<Trade | null> {
  const result = await db.query<Trade>(
    `UPDATE trades SET
       sender_ready = CASE WHEN sender_id = $2 THEN $3 ELSE sender_ready END,
       receiver_ready = CASE WHEN receiver_id = $2 THEN $3 ELSE receiver_ready END
     WHERE id = $1
     RETURNING *`,
    [id, playerId, ready],
  );
  return result.rows[0] ?? null;
}

export async function updateStatus(
  id: string,
  status: TradeStatus,
  db: Db = pool,
): Promise<Trade | null> {
  const result = await db.query<Trade>(
    `UPDATE trades SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id],
  );
  return result.rows[0] ?? null;
}

export async function ensureOffer(
  tradeId: string,
  playerId: string,
  db: Db = pool,
): Promise<TradeOffer> {
  const result = await db.query<{
    trade_id: string;
    player_id: string;
    coins: number;
    items: unknown;
  }>(
    `INSERT INTO trade_offers (trade_id, player_id) VALUES ($1, $2)
     ON CONFLICT (trade_id, player_id) DO NOTHING
     RETURNING *`,
    [tradeId, playerId],
  );
  if (result.rows[0]) return mapOffer(result.rows[0]);

  const existing = await findOffer(tradeId, playerId, db);
  if (existing) return existing;

  throw new Error(`Unable to create trade offer for ${playerId}`);
}

export async function findOffer(
  tradeId: string,
  playerId: string,
  db: Db = pool,
): Promise<TradeOffer | null> {
  const result = await db.query<{
    trade_id: string;
    player_id: string;
    coins: number;
    items: unknown;
  }>(`SELECT * FROM trade_offers WHERE trade_id = $1 AND player_id = $2`, [
    tradeId,
    playerId,
  ]);
  return result.rows[0] ? mapOffer(result.rows[0]) : null;
}

export async function findOffersByTradeId(
  tradeId: string,
  db: Db = pool,
): Promise<TradeOffer[]> {
  const result = await db.query<{
    trade_id: string;
    player_id: string;
    coins: number;
    items: unknown;
  }>(`SELECT * FROM trade_offers WHERE trade_id = $1`, [tradeId]);
  return result.rows.map(mapOffer);
}

export async function updateOffer(
  tradeId: string,
  playerId: string,
  fields: Partial<Pick<TradeOffer, "coins" | "items">>,
  db: Db = pool,
): Promise<TradeOffer | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (fields.coins !== undefined) {
    setClauses.push(`coins = $${String(paramIndex)}`);
    values.push(fields.coins);
    paramIndex++;
  }
  if (fields.items !== undefined) {
    setClauses.push(`items = $${String(paramIndex)}`);
    values.push(JSON.stringify(fields.items));
    paramIndex++;
  }

  if (setClauses.length === 0) return findOffer(tradeId, playerId, db);

  values.push(tradeId, playerId);
  const result = await db.query<{
    trade_id: string;
    player_id: string;
    coins: number;
    items: unknown;
  }>(
    `UPDATE trade_offers SET ${setClauses.join(", ")}
     WHERE trade_id = $${String(paramIndex)} AND player_id = $${String(paramIndex + 1)}
     RETURNING *`,
    values,
  );
  return result.rows[0] ? mapOffer(result.rows[0]) : null;
}
