import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import { drawBuildingCard } from "#/images/campsite/drawBuildingCard.js";
import { drawStatCard } from "#/images/campsite/drawStatCard.js";
import { fillRoundRect } from "#/images/shared/canvas.js";
import { drawEmoji } from "#/images/shared/emoji.js";
import { SCALE, COLORS } from "#/images/shared/layout.js";
import { font } from "#/images/shared/typography.js";
import type {
  CampsiteCardData,
  UpgradeCardData,
} from "#/images/types/index.js";
import { CAMP_NAME } from "#/game/services/campService.js";

const CAMP_WIDTH = 520 * SCALE;
const CAMP_HEIGHT = 492 * SCALE;
const PADDING = 24 * SCALE;

async function drawCostPill(
  ctx: SKRSContext2D,
  emoji: string,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<void> {
  fillRoundRect(ctx, x, y, width, height, height / 2, COLORS.campAccent);

  const emojiSize = 14 * SCALE;
  const emojiGap = 8 * SCALE;
  ctx.font = font(11 * SCALE, "bold");
  const textWidth = ctx.measureText(text).width;
  const contentStart = x + (width - (emojiSize + emojiGap + textWidth)) / 2;
  await drawEmoji(
    ctx,
    emoji,
    contentStart,
    y + (height - emojiSize) / 2,
    emojiSize,
  );
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, contentStart + emojiSize + emojiGap, y + height / 2);
}

async function drawUpgradeCard(
  ctx: SKRSContext2D,
  upgrade: UpgradeCardData,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<void> {
  fillRoundRect(ctx, x, y, width, height, 12 * SCALE, COLORS.upgradeBg);

  const eyebrowY = y + 12 * SCALE;
  ctx.font = font(10 * SCALE);
  ctx.fillStyle = COLORS.eyebrow;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("NEXT UPGRADE", x + 16 * SCALE, eyebrowY);

  const pillWidth = 110 * SCALE;
  const pillHeight = 20 * SCALE;
  const pillGap = 4 * SCALE;
  const pillX = x + width - pillWidth - 16 * SCALE;
  let pillY = y + 9 * SCALE;

  if (upgrade.costCoins > 0) {
    await drawCostPill(
      ctx,
      "🪙",
      String(upgrade.costCoins),
      pillX,
      pillY,
      pillWidth,
      pillHeight,
    );
    pillY += pillHeight + pillGap;
  } else if (upgrade.costItems.length === 0) {
    await drawCostPill(ctx, "🪙", "—", pillX, pillY, pillWidth, pillHeight);
    pillY += pillHeight + pillGap;
  }

  for (const item of upgrade.costItems) {
    const label =
      item.quantity > 1 ? `${String(item.quantity)} ${item.name}` : item.name;
    await drawCostPill(
      ctx,
      item.emoji,
      label,
      pillX,
      pillY,
      pillWidth,
      pillHeight,
    );
    pillY += pillHeight + pillGap;
  }

  await drawEmoji(
    ctx,
    upgrade.emoji,
    x + 16 * SCALE,
    y + 38 * SCALE,
    30 * SCALE,
  );

  ctx.font = font(13 * SCALE, "bold");
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(upgrade.name, x + 54 * SCALE, y + 40 * SCALE);

  ctx.font = font(11 * SCALE);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(upgrade.effect, x + 54 * SCALE, y + 60 * SCALE);
}

export async function generateCampsiteCard(
  data: CampsiteCardData,
): Promise<Buffer> {
  const canvas = createCanvas(CAMP_WIDTH, CAMP_HEIGHT);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  fillRoundRect(
    ctx,
    0,
    0,
    CAMP_WIDTH,
    CAMP_HEIGHT,
    20 * SCALE,
    COLORS.campBody,
  );

  ctx.font = font(28 * SCALE, "bold");
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(CAMP_NAME, CAMP_WIDTH / 2, 32 * SCALE);

  ctx.font = font(14 * SCALE);
  ctx.fillStyle = COLORS.title;
  ctx.textAlign = "center";
  ctx.fillText(`${data.characterName}'s Campsite`, CAMP_WIDTH / 2, 64 * SCALE);

  const statGap = 12 * SCALE;
  const statWidth = (CAMP_WIDTH - PADDING * 2 - statGap * 3) / 4;
  const statY = 108 * SCALE;
  for (let index = 0; index < data.stats.length; index++) {
    drawStatCard(
      ctx,
      data.stats[index],
      PADDING + index * (statWidth + statGap),
      statY,
      statWidth,
      86 * SCALE,
    );
  }

  ctx.font = font(12 * SCALE, "bold");
  ctx.fillStyle = COLORS.campAccent;
  ctx.textAlign = "left";
  ctx.fillText("Camp Buildings", PADDING, 220 * SCALE);

  const buildingGap = 8 * SCALE;
  const buildingWidth = (CAMP_WIDTH - PADDING * 2 - buildingGap * 4) / 5;
  const buildingY = 232 * SCALE;
  for (let index = 0; index < data.buildings.length; index++) {
    await drawBuildingCard(
      ctx,
      data.buildings[index],
      PADDING + index * (buildingWidth + buildingGap),
      buildingY,
      buildingWidth,
      116 * SCALE,
    );
  }

  await drawUpgradeCard(
    ctx,
    data.upgrade,
    PADDING,
    384 * SCALE,
    CAMP_WIDTH - PADDING * 2,
    84 * SCALE,
  );

  return Buffer.from(await canvas.encode("png"));
}
