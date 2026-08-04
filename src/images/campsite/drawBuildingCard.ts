import type { SKRSContext2D } from "@napi-rs/canvas";
import { drawEmoji } from "#/images/shared/emoji.js";
import { fillRoundRect } from "#/images/shared/canvas.js";
import { SCALE, COLORS, withAlpha } from "#/images/shared/layout.js";
import { font } from "#/images/shared/typography.js";
import type { BuildingCardData } from "#/images/types/index.js";

export async function drawBuildingCard(
  ctx: SKRSContext2D,
  card: BuildingCardData,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<void> {
  fillRoundRect(
    ctx,
    x,
    y,
    width,
    height,
    12 * SCALE,
    card.isLocked ? withAlpha(COLORS.lockedBg, 0.05) : COLORS.card,
  );

  const centerX = x + width / 2;

  if (card.isLocked) {
    await drawEmoji(
      ctx,
      "🔒",
      centerX - 14 * SCALE,
      y + 34 * SCALE,
      28 * SCALE,
    );
    ctx.font = font(10 * SCALE);
    ctx.fillStyle = COLORS.mutedLight;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Coming Soon", centerX, y + 68 * SCALE);
    return;
  }

  await drawEmoji(
    ctx,
    card.emoji,
    centerX - 18 * SCALE,
    y + 14 * SCALE,
    36 * SCALE,
  );

  ctx.font = font(11 * SCALE, "bold");
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(card.name, centerX, y + 56 * SCALE);

  const badgeWidth = 44 * SCALE;
  const badgeHeight = 18 * SCALE;
  fillRoundRect(
    ctx,
    centerX - badgeWidth / 2,
    y + 78 * SCALE,
    badgeWidth,
    badgeHeight,
    9 * SCALE,
    COLORS.campAccent,
  );
  ctx.font = font(9 * SCALE, "bold");
  ctx.fillStyle = COLORS.white;
  ctx.textBaseline = "middle";
  ctx.fillText(
    `Lv.${String(card.level)}`,
    centerX,
    y + 78 * SCALE + badgeHeight / 2,
  );
}
