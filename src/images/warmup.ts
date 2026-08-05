import { prefetchEmojis } from "./shared/emoji.js";
import { SCALE } from "./shared/layout.js";
import { logger } from "../utils/logger.js";
import { CAMP_UPGRADES } from "../game/data/campUpgrades.js";
import { ITEMS } from "../game/data/items.js";

export async function warmImageCaches(): Promise<void> {
  try {
    const upgradeEmojis = Object.values(CAMP_UPGRADES).map(
      (upgrade) => upgrade.emoji,
    );
    const costEmojis = Object.values(CAMP_UPGRADES)
      .flatMap((upgrade) =>
        upgrade.levels.flatMap((level) =>
          level.costItems.map((cost) => cost.itemKey),
        ),
      )
      .map((itemKey) => ITEMS[itemKey].emoji);

    await Promise.all([
      prefetchEmojis(upgradeEmojis, 36 * SCALE),
      prefetchEmojis(["🪙", ...new Set(costEmojis)], 14 * SCALE),
      prefetchEmojis(["🔒", "❓"], 28 * SCALE),
    ]);
    logger.info("Image caches warmed");
  } catch (error) {
    logger.error(error, "Failed to warm image caches");
  }
}
