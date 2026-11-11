import { performance } from "node:perf_hooks";
import { vanta } from "../utils/vanta.js";
import { generateCamperCard as renderCamperCard } from "./profile/generateProfileCard.js";
import { generateCampsiteCard as renderCampsiteCard } from "./campsite/generateCampsiteCard.js";
import { generateShopCard as renderShopCard } from "./shop/generateShopCard.js";
import { generateStatisticsCard as renderStatisticsCard } from "./statistics/generateStatisticsCard.js";
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

export const generateCamperCard = (data: CardData): Promise<Buffer> =>
  measureLatency("profile", () => renderCamperCard(data));

export const generateCampsiteCard = (data: CampsiteCardData): Promise<Buffer> =>
  measureLatency("campsite", () => renderCampsiteCard(data));

export const generateShopCard = (data: ShopCardData): Promise<Buffer> =>
  measureLatency("shop", () => renderShopCard(data));

export const generateStatisticsCard = (
  data: StatisticsCardData,
): Promise<Buffer> =>
  measureLatency("statistics", () => renderStatisticsCard(data));

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
