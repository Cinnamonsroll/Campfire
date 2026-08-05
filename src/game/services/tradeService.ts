import { pool } from "../../database/client.js";
import type { Db } from "../../database/db.js";
import {
  create as createTradeRow,
  ensureOffer,
  findActiveBetween,
  findById as findTradeById,
  findOffersByTradeId,
  setReady,
  updateOffer,
  updateStatus,
  type Trade,
  type TradeItems,
  type TradeOffer,
} from "../../database/repositories/tradeRepository.js";
import {
  findById as findPlayerById,
  update as updatePlayer,
  type Player,
} from "../../database/repositories/playerRepository.js";
import {
  addItems,
  findQuantitiesByItemKeys,
  removeItems,
} from "../../database/repositories/inventoryRepository.js";
import { withTransaction } from "../../database/transaction.js";
import { getItemDefinition } from "../data/items.js";
import { isStartingItem } from "../data/startingItems.js";

export const TRADE_TTL_MINUTES = 5;

export class TradeError extends Error {}

function firstItem<T>(rows: readonly T[]): T | undefined {
  return rows[0];
}

type OwnedItemRow = Awaited<
  ReturnType<typeof findQuantitiesByItemKeys>
>[number];

export interface TradeParticipant {
  player: Player;
  offer: TradeOffer;
}

export interface TradeState {
  trade: Trade;
  sender: TradeParticipant;
  receiver: TradeParticipant;
}

export interface TradeExchangeSummary {
  senderGives: { coins: number; items: TradeItems };
  receiverGives: { coins: number; items: TradeItems };
}

export interface AcceptResult {
  trade: Trade;
  executed: boolean;
  summary: TradeExchangeSummary | null;
}

function assertParticipant(playerId: string, trade: Trade): void {
  if (trade.sender_id !== playerId && trade.receiver_id !== playerId) {
    throw new TradeError("This isn't your trade.");
  }
}

function assertOpen(trade: Trade): void {
  if (trade.status !== "pending" && trade.status !== "accepted") {
    throw new TradeError("That trade is no longer open.");
  }
  if (trade.expires_at.getTime() < Date.now()) {
    throw new TradeError(
      "That trade has expired. Start a new one with `/trade`.",
    );
  }
}

async function loadTradeState(tradeId: string, db: Db): Promise<TradeState> {
  const trade = await findTradeById(tradeId, db);
  if (!trade) throw new TradeError("That trade could not be found.");

  const offers = await findOffersByTradeId(tradeId, db);
  const offerByPlayer = new Map(
    offers.map((offer) => [offer.player_id, offer]),
  );

  const senderPlayer = await findPlayerById(trade.sender_id, db);
  const receiverPlayer = await findPlayerById(trade.receiver_id, db);
  if (!senderPlayer || !receiverPlayer) {
    throw new TradeError("One of the campers is no longer here.");
  }

  const build = async (player: Player): Promise<TradeParticipant> => ({
    player,
    offer:
      offerByPlayer.get(player.id) ??
      (await ensureOffer(tradeId, player.id, db)),
  });

  return {
    trade,
    sender: await build(senderPlayer),
    receiver: await build(receiverPlayer),
  };
}

function assertAccepted(trade: Trade): void {
  if (trade.status !== "accepted") {
    throw new TradeError("The other camper needs to accept this trade first.");
  }
}

async function resetReady(trade: Trade, db: Db): Promise<void> {
  if (trade.sender_ready) await setReady(trade.id, trade.sender_id, false, db);
  if (trade.receiver_ready) {
    await setReady(trade.id, trade.receiver_id, false, db);
  }
}

export async function createTrade(
  senderId: string,
  receiverId: string,
): Promise<TradeState> {
  if (senderId === receiverId) {
    throw new TradeError("You can't trade with yourself.");
  }

  return withTransaction(async (db) => {
    const existing = await findActiveBetween(senderId, receiverId, db);
    if (existing) {
      throw new TradeError(
        "You two already have a trade on the table. Finish it first.",
      );
    }

    const trade = await createTradeRow(senderId, receiverId, db);
    await ensureOffer(trade.id, senderId, db);
    await ensureOffer(trade.id, receiverId, db);

    return loadTradeState(trade.id, db);
  });
}

export async function getTradeState(
  tradeId: string,
  db: Db = pool,
): Promise<TradeState> {
  return loadTradeState(tradeId, db);
}

export async function addCoins(
  playerId: string,
  tradeId: string,
  delta: number,
): Promise<TradeState> {
  return withTransaction(async (db) => {
    const { trade, sender, receiver } = await loadTradeState(tradeId, db);
    assertOpen(trade);
    assertAccepted(trade);
    assertParticipant(playerId, trade);
    const side = playerId === sender.player.id ? sender : receiver;
    const current = side.offer.coins;
    const next = Math.max(0, Math.min(side.player.coins, current + delta));

    await updateOffer(tradeId, playerId, { coins: next }, db);
    await resetReady(trade, db);

    return loadTradeState(tradeId, db);
  });
}

export async function addItem(
  playerId: string,
  tradeId: string,
  itemKey: string,
): Promise<TradeState> {
  return withTransaction(async (db) => {
    const { trade, sender, receiver } = await loadTradeState(tradeId, db);
    assertOpen(trade);
    assertAccepted(trade);
    assertParticipant(playerId, trade);
    if (isStartingItem(itemKey)) {
      throw new TradeError(
        "Starter gear is bound to its camper and cannot be traded.",
      );
    }

    const side = playerId === sender.player.id ? sender : receiver;
    const offered = side.offer.items[itemKey] ?? 0;
    const owned = await findQuantitiesByItemKeys(playerId, [itemKey], db);
    const ownedRow = firstItem(owned);
    const ownedQuantity = ownedRow?.quantity ?? 0;

    if (ownedQuantity <= offered) {
      const item = getItemDefinition(itemKey);
      throw new TradeError(
        `You don't have any more ${item?.name ?? "of that"} to offer.`,
      );
    }

    const items: TradeItems = { ...side.offer.items, [itemKey]: offered + 1 };
    await updateOffer(tradeId, playerId, { items }, db);
    await resetReady(trade, db);

    return loadTradeState(tradeId, db);
  });
}

export async function removeItem(
  playerId: string,
  tradeId: string,
  itemKey: string,
): Promise<TradeState> {
  return withTransaction(async (db) => {
    const { trade, sender, receiver } = await loadTradeState(tradeId, db);
    assertOpen(trade);
    assertAccepted(trade);
    assertParticipant(playerId, trade);

    const side = playerId === sender.player.id ? sender : receiver;
    const offered = side.offer.items[itemKey] ?? 0;
    if (offered <= 0) {
      throw new TradeError("That item isn't in your offer.");
    }

    const remaining = offered - 1;
    const items: TradeItems = {};
    for (const [key, qty] of Object.entries(side.offer.items)) {
      if (key === itemKey) {
        if (remaining > 0) items[key] = remaining;
      } else {
        items[key] = qty;
      }
    }

    await updateOffer(tradeId, playerId, { items }, db);
    await resetReady(trade, db);

    return loadTradeState(tradeId, db);
  });
}

export async function declineTrade(
  playerId: string,
  tradeId: string,
): Promise<Trade> {
  return withTransaction(async (db) => {
    const { trade } = await loadTradeState(tradeId, db);
    assertOpen(trade);
    assertParticipant(playerId, trade);

    const updated = await updateStatus(tradeId, "declined", db);
    if (!updated) throw new TradeError("That trade could not be updated.");
    return updated;
  });
}

export async function acceptTradeInvitation(
  playerId: string,
  tradeId: string,
): Promise<TradeState> {
  return withTransaction(async (db) => {
    const { trade } = await loadTradeState(tradeId, db);
    assertOpen(trade);
    if (trade.status !== "pending") {
      throw new TradeError("This trade invitation has already been accepted.");
    }
    if (trade.receiver_id !== playerId) {
      throw new TradeError("Only the invited camper can accept this trade.");
    }

    const updated = await updateStatus(trade.id, "accepted", db);
    if (!updated) throw new TradeError("That trade could not be updated.");
    return loadTradeState(tradeId, db);
  });
}

export async function acceptTrade(
  playerId: string,
  tradeId: string,
): Promise<AcceptResult> {
  return withTransaction(async (db) => {
    const { trade } = await loadTradeState(tradeId, db);
    assertOpen(trade);
    assertAccepted(trade);
    assertParticipant(playerId, trade);

    const updated = await setReady(trade.id, playerId, true, db);
    if (!updated) throw new TradeError("That trade could not be updated.");

    if (updated.sender_ready && updated.receiver_ready) {
      const summary = await executeTrade(tradeId, db);
      return { trade: updated, executed: true, summary };
    }

    return { trade: updated, executed: false, summary: null };
  });
}

function validateOwnership(
  state: TradeState,
  ownedByPlayer: Map<string, Map<string, OwnedItemRow>>,
): void {
  for (const side of [state.sender, state.receiver]) {
    const { player, offer } = side;
    if (offer.coins > player.coins) {
      throw new TradeError(
        `${player.character_name ?? "A camper"} no longer has enough coins for their offer.`,
      );
    }

    const ownedByKey = ownedByPlayer.get(player.id);
    if (!ownedByKey) continue;

    for (const [itemKey, quantity] of Object.entries(offer.items)) {
      if ((ownedByKey.get(itemKey)?.quantity ?? 0) < quantity) {
        const item = getItemDefinition(itemKey);
        throw new TradeError(
          `${player.character_name ?? "A camper"} no longer has enough ${item?.name ?? itemKey} to trade.`,
        );
      }
    }
  }
}

async function transferOffer(
  from: TradeParticipant,
  to: TradeParticipant,
  ownedByKey: Map<string, OwnedItemRow>,
  db: Db,
): Promise<void> {
  const { player, offer } = from;

  if (offer.coins > 0) {
    player.coins -= offer.coins;
    to.player.coins += offer.coins;
  }

  for (const [itemKey, quantity] of Object.entries(offer.items)) {
    if (quantity <= 0) continue;

    const row = ownedByKey.get(itemKey);
    if (!row) {
      throw new TradeError("A camper no longer has the items they offered.");
    }
    await removeItems(player.id, [{ itemId: row.itemId, quantity }], db);
    await addItems(to.player.id, [{ itemId: row.itemId, quantity }], db);
  }
}

export async function executeTrade(
  tradeId: string,
  db: Db,
): Promise<TradeExchangeSummary> {
  const state = await loadTradeState(tradeId, db);
  const { trade, sender, receiver } = state;

  if (trade.status !== "accepted") {
    throw new TradeError("That trade is no longer open.");
  }
  if (!trade.sender_ready || !trade.receiver_ready) {
    throw new TradeError("Both campers need to accept before trading.");
  }
  if (trade.expires_at.getTime() < Date.now()) {
    throw new TradeError("That trade has expired.");
  }

  const ownedByPlayer = new Map<string, Map<string, OwnedItemRow>>();
  for (const side of [sender, receiver]) {
    const itemKeys = Object.keys(side.offer.items);
    if (itemKeys.length === 0) continue;

    const owned = await findQuantitiesByItemKeys(side.player.id, itemKeys, db);
    ownedByPlayer.set(
      side.player.id,
      new Map(owned.map((entry) => [entry.itemKey, entry])),
    );
  }

  validateOwnership(state, ownedByPlayer);

  await transferOffer(
    sender,
    receiver,
    ownedByPlayer.get(sender.player.id) ?? new Map<string, OwnedItemRow>(),
    db,
  );
  await transferOffer(
    receiver,
    sender,
    ownedByPlayer.get(receiver.player.id) ?? new Map<string, OwnedItemRow>(),
    db,
  );

  await updatePlayer(sender.player.id, { coins: sender.player.coins }, db);
  await updatePlayer(receiver.player.id, { coins: receiver.player.coins }, db);
  await updateStatus(tradeId, "completed", db);

  return {
    senderGives: { coins: sender.offer.coins, items: sender.offer.items },
    receiverGives: { coins: receiver.offer.coins, items: receiver.offer.items },
  };
}
