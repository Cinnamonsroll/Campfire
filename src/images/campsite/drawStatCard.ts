import type { SKRSContext2D } from "@napi-rs/canvas";
import { fillRoundRect, drawProgressBar } from "../images/shared/canvas.js";
import { SCALE, COLORS } from "../images/shared/layout.js";
import { font } from "../images/shared/typography.js";
import type { StatCardData } from "../images/types/index.js";

export function drawStatCard(
  ctx: SKRSContext2D,
  card: StatCardData,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  fillRoundRect(ctx, x, y, width, height, 12 * SCALE, COLORS.card);

  ctx.font = font(10 * SCALE);
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(card.label, x + 12 * SCALE, y + 12 * SCALE);

  if (card.progress) {
    const progress =
      card.progress.max > 0 ? card.progress.current / card.progress.max : 0;

    ctx.font = font(18 * SCALE, "bold");
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(card.value, x + width - 12 * SCALE, y + height - 12 * SCALE);

    drawProgressBar(
      ctx,
      x + 12 * SCALE,
      y + height - 8 * SCALE,
      width - 24 * SCALE,
      6 * SCALE,
      progress,
      COLORS.statTrack,
      COLORS.campAccent,
    );
  } else {
    ctx.font = font(20 * SCALE, "bold");
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(card.value, x + width - 12 * SCALE, y + height - 12 * SCALE);
  }
}
