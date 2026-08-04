import type { Db } from "../database/db.js";
import { withTransaction } from "../database/transaction.js";
import {
  findById as findPlayerById,
  update as updatePlayer,
  type Player,
} from "../database/repositories/playerRepository.js";
import { ensureItemsByKeys } from "../database/repositories/itemRepository.js";
import {
  addItems,
  countTotal,
} from "../database/repositories/inventoryRepository.js";
import { findByPlayerId as findCamp } from "../database/repositories/campRepository.js";
import { addStats } from "../database/repositories/statRepository.js";
import { upsertPurchase } from "../database/repositories/shopRepository.js";
import {
  getBuildingLevel,
  getStorageCapacity,
} from "../game/services/campService.js";
import { todayKey } from "../game/utils/date.js";
import { recordDailyProgress } from "../game/services/dailyQuestService.js";
import {
  getShop,
  type ShopItemView,
} from "../game/services/shop/shopService.js";
import {
  getMaxEnergyForPlayer,
  restoreEnergyToFull,
} from "../game/services/shop/energyService.js";

export class ShopError extends Error {}

export interface PurchaseResult {
  item: ShopItemView;
  player: Player;
  coinsSpent: number;
  energyRestored: boolean;
}

async function validateAndDeduct(
  player: Player,
  db: Db,
  discordId: string,
  date: string,
  itemKey: string,
): Promise<{ shopItem: ShopItemView; price: number; isEnergyItem: boolean }> {
  const shop = await getShop(player, discordId, date, db);
  const shopItem = shop.items.find((item) => item.entry.key === itemKey);
  if (!shopItem) {
    throw new ShopError("That isn't on the shelf today.");
  }
  if (shopItem.remaining <= 0) {
    throw new ShopError("That's all sold out for today.");
  }
  if (player.coins < shopItem.entry.price) {
    throw new ShopError("Not enough coins for that.");
  }

  const { entry } = shopItem;
  if (entry.isEnergyItem) {
    return { shopItem, price: entry.price, isEnergyItem: true };
  }

  const camp = await findCamp(player.id, db);
  const used = await countTotal(player.id, db);
  const capacity = getStorageCapacity(getBuildingLevel(camp, "storage"));
  if (used + 1 > capacity) {
    throw new ShopError(
      `Storage is full (${String(used)}/${String(capacity)}). Make room before buying more.`,
    );
  }

  return { shopItem, price: entry.price, isEnergyItem: false };
}

export async function purchaseItem(
  player: Player,
  discordId: string,
  date: string,
  itemKey: string,
): Promise<PurchaseResult> {
  if (date !== todayKey()) {
    throw new ShopError(
      "The store has restocked since then. Head to `/shop` for the fresh supply.",
    );
  }

  const purchase = async (tx: Db): Promise<PurchaseResult> => {
    const fresh = await findPlayerById(player.id, tx);
    if (!fresh) {
      throw new ShopError("No camper here yet. Use `/start` to begin.");
    }

    const { shopItem, price, isEnergyItem } = await validateAndDeduct(
      fresh,
      tx,
      discordId,
      date,
      itemKey,
    );

    let energyRestored = false;
    if (isEnergyItem) {
      energyRestored = fresh.energy < (await getMaxEnergyForPlayer(fresh, tx));
      await restoreEnergyToFull(fresh, tx);
    } else {
      const dbItems = await ensureItemsByKeys([itemKey], tx);
      if (dbItems.length === 0) {
        throw new ShopError("That item couldn't be wrapped up. Try again.");
      }
      await addItems(fresh.id, [{ itemId: dbItems[0].id, quantity: 1 }], tx);
      await recordDailyProgress(
        fresh.id,
        discordId,
        { itemsGranted: [{ itemKey, quantity: 1 }] },
        tx,
      );
    }

    fresh.coins -= price;
    await updatePlayer(fresh.id, { coins: fresh.coins }, tx);
    await upsertPurchase(fresh.id, date, itemKey, 1, price, tx);
    await addStats(fresh, { coins_spent: price }, tx);

    return {
      item: {
        entry: shopItem.entry,
        purchased: shopItem.purchased + 1,
        remaining: shopItem.remaining - 1,
      },
      player: fresh,
      coinsSpent: price,
      energyRestored,
    };
  };

  return withTransaction(purchase);
}
