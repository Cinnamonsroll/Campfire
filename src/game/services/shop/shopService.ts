import { pool } from "../database/client.js";
import type { Db } from "../database/db.js";
import type { Player } from "../database/repositories/playerRepository.js";
import { findByPlayerIdAndDate } from "../database/repositories/shopRepository.js";
import { secondsUntilTomorrow } from "../game/utils/date.js";
import {
  generateShop,
  type ShopEntry,
} from "../game/services/shop/shopGenerator.js";
import type { ShopCardData } from "../images/types/index.js";

export interface ShopItemView {
  entry: ShopEntry;
  purchased: number;
  remaining: number;
}

export interface ShopView {
  player: Player;
  date: string;
  items: ShopItemView[];
  coins: number;
  refreshSeconds: number;
  refreshLabel: string;
}

const DEFAULT_OWNER_NAME = "Camper";

export function formatRefreshLabel(seconds: number): string {
  const minutes = Math.max(Math.ceil(seconds / 60), 1);
  if (minutes < 60) return `${String(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${String(hours)}h ${String(remainingMinutes)}m`
    : `${String(hours)}h`;
}

export async function getShop(
  player: Player,
  discordId: string,
  date: string,
  db: Db = pool,
): Promise<ShopView> {
  const entries = generateShop(discordId, date);
  const purchases = await findByPlayerIdAndDate(player.id, date, db);
  const purchasedByKey = new Map(
    purchases.map((purchase) => [purchase.item_key, purchase.quantity]),
  );

  const items = entries.map((entry) => {
    const purchased = purchasedByKey.get(entry.key) ?? 0;
    return {
      entry,
      purchased,
      remaining: Math.max(entry.stock - purchased, 0),
    };
  });

  const refreshSeconds = secondsUntilTomorrow();
  return {
    player,
    date,
    items,
    coins: player.coins,
    refreshSeconds,
    refreshLabel: `Refreshes in ${formatRefreshLabel(refreshSeconds)}`,
  };
}

export function toShopCardData(view: ShopView): ShopCardData {
  return {
    characterName: view.player.character_name ?? DEFAULT_OWNER_NAME,
    coins: view.coins,
    refreshLabel: view.refreshLabel,
    items: view.items.map(({ entry, remaining }) => ({
      emoji: entry.emoji,
      name: entry.name,
      description: entry.description,
      flavor: entry.flavor,
      price: entry.price,
      rarity: entry.rarity,
      remaining,
      isEnergyItem: entry.isEnergyItem,
    })),
  };
}
