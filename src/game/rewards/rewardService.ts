import type { Player } from "../database/repositories/playerRepository.js";
import { update as updatePlayer } from "../database/repositories/playerRepository.js";
import { pool } from "../database/client.js";
import { ensureItemsByKeys } from "../database/repositories/itemRepository.js";
import { addItems } from "../database/repositories/inventoryRepository.js";
import { addStats } from "../database/repositories/statRepository.js";
import { withTransaction } from "../database/transaction.js";
import { grantXp, type GrantXpResult } from "../game/utils/xp.js";
import { ITEMS } from "../game/data/items.js";
import type { Db } from "../database/db.js";

export interface RewardItemGrant {
  itemKey: string;
  quantity: number;
}

export interface GrantRewardsOptions {
  player: Player;
  xp?: number;
  coins?: number;
  items?: RewardItemGrant[];
  energyAfter?: number;
  xpMultiplier?: number;
  capacity?: { used: number; max: number };
}

export class StorageFullError extends Error {}

export interface RewardItemSummary {
  itemKey: string;
  name: string;
  emoji: string;
  quantity: number;
}

export interface RewardSummary {
  xpGained: number;
  coinsGained: number;
  items: RewardItemSummary[];
  levelUp: GrantXpResult | null;
}

export interface GrantRewardsResult {
  player: Player;
  summary: RewardSummary;
}

interface WriteRewardsOptions {
  player: Player;
  items: RewardItemGrant[];
  energyAfter?: number;
  coinsEarned: number;
  caughtFish: number;
  itemsCollected: number;
  db: Db;
}

async function writeRewards(options: WriteRewardsOptions): Promise<void> {
  const { player, items, energyAfter, db } = options;

  const dbItems = await ensureItemsByKeys(
    items.map((grant) => grant.itemKey),
    db,
  );

  const itemIdByKey = new Map(dbItems.map((item) => [item.item_key, item.id]));

  const inventoryEntries = items
    .map((grant) => ({
      itemId: itemIdByKey.get(grant.itemKey),
      quantity: grant.quantity,
    }))
    .filter(
      (entry): entry is { itemId: string; quantity: number } =>
        entry.itemId !== undefined,
    );

  if (inventoryEntries.length > 0) {
    await addItems(player.id, inventoryEntries, db);
  }

  await updatePlayer(
    player.id,
    {
      level: player.level,
      xp: player.xp,
      coins: player.coins,
      ...(energyAfter !== undefined ? { energy: energyAfter } : {}),
    },
    db,
  );

  await addStats(
    player,
    {
      ...(options.coinsEarned > 0 ? { coins_earned: options.coinsEarned } : {}),
      ...(options.caughtFish > 0 ? { caught_fish: options.caughtFish } : {}),
      ...(options.itemsCollected > 0
        ? { items_collected: options.itemsCollected }
        : {}),
    },
    db,
  );
}

export async function grantRewards(
  options: GrantRewardsOptions,
  db: Db = pool,
): Promise<GrantRewardsResult> {
  const {
    player,
    xp = 0,
    coins = 0,
    items = [],
    energyAfter,
    xpMultiplier = 1,
    capacity,
  } = options;

  const gainedXp = Math.round(xp * xpMultiplier);

  if (capacity) {
    const incoming = items.reduce((sum, grant) => sum + grant.quantity, 0);
    if (capacity.used + incoming > capacity.max) {
      throw new StorageFullError(
        `Storage is full (${String(capacity.used)}/${String(capacity.max)}). Upgrade Storage at camp before carrying more.`,
      );
    }
  }

  const xpResult = grantXp(player, gainedXp);
  player.coins += coins;

  const coinsEarned = coins;
  const caughtFish = items
    .filter((grant) => ITEMS[grant.itemKey].category === "fish")
    .reduce((sum, grant) => sum + grant.quantity, 0);
  const itemsCollected = items.reduce((sum, grant) => sum + grant.quantity, 0);

  if (db === pool) {
    await withTransaction((tx) =>
      writeRewards({
        player,
        items,
        energyAfter,
        coinsEarned,
        caughtFish,
        itemsCollected,
        db: tx,
      }),
    );
  } else {
    await writeRewards({
      player,
      items,
      energyAfter,
      coinsEarned,
      caughtFish,
      itemsCollected,
      db,
    });
  }

  return {
    player,
    summary: {
      xpGained: gainedXp,
      coinsGained: coins,
      items: items.map((grant) => {
        const definition = ITEMS[grant.itemKey];
        return {
          itemKey: grant.itemKey,
          name: definition.name,
          emoji: definition.emoji,
          quantity: grant.quantity,
        };
      }),
      levelUp: xpResult.levelsGained > 0 ? xpResult : null,
    },
  };
}
