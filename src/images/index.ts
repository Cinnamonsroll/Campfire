import { performance } from "node:perf_hooks";
import { vanta } from "../utils/vanta.js";
import {
  generateCamperCard as renderCamperCard,
  generateStatisticsCard as renderStatisticsCard,
  type ProfileAssets,
  type ProfileCard,
} from "./profile/renderProfileCards.js";
import { generateCampsiteCard as renderCampsiteCard } from "./campsite/generateCampsiteCard.js";
import { generateShopCard as renderShopCard } from "./shop/generateShopCard.js";
import type {
  CardData,
  CampsiteCardData,
  ShopCardData,
  StatisticsCardData,
} from "./types/index.js";

async function measureLatency<T>(
  card: string,
  render: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    return await render();
  } finally {
    void vanta.measure({
      name: "image.latency",
      value: Math.round(performance.now() - start),
      unit: "ms",
      tags: { card },
    });
  }
}

export const generateCamperCard = (
  data: CardData,
  assets?: ProfileAssets,
  maxBytes?: number,
): Promise<ProfileCard> =>
  measureLatency("profile", () => renderCamperCard(data, assets, maxBytes));

export const generateCampsiteCard = (data: CampsiteCardData): Promise<Buffer> =>
  measureLatency("campsite", () => renderCampsiteCard(data));

export const generateShopCard = (data: ShopCardData): Promise<Buffer> =>
  measureLatency("shop", () => renderShopCard(data));

export const generateStatisticsCard = (
  data: StatisticsCardData,
  assets?: ProfileAssets,
  maxBytes?: number,
): Promise<ProfileCard> =>
  measureLatency("statistics", () =>
    renderStatisticsCard(data, assets, maxBytes),
  );

export type {
  CardData,
  InventorySlot,
  StatCardData,
  BuildingCardData,
  UpgradeCardData,
  CampsiteCardData,
  ShopCardData,
  ShopItemCardData,
  StatisticCardData,
  StatisticsCardData,
} from "./types/index.js";

export type { ProfileAssets, ProfileCard };
