import { loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import { drawEmoji } from "../images/shared/emoji.js";
import { SCALE, COLORS, withAlpha } from "../images/shared/layout.js";
import { font } from "../images/shared/typography.js";

const imageCache = new Map<string, Awaited<ReturnType<typeof loadImage>>>();

export function roundRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

export function fillRoundRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: string,
): void {
  roundRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = color;
  ctx.fill();
}

async function loadCachedImage(
  url: string,
): Promise<Awaited<ReturnType<typeof loadImage>>> {
  let img = imageCache.get(url);
  if (!img) {
    img = await loadImage(url);
    imageCache.set(url, img);
  }
  return img;
}

export async function drawAvatar(
  ctx: SKRSContext2D,
  url: string,
  centerX: number,
  centerY: number,
  radius: number,
  fallbackColor: string,
  initialChar: string,
): Promise<void> {
  try {
    const img = await loadCachedImage(url);
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      img,
      centerX - radius,
      centerY - radius,
      radius * 2,
      radius * 2,
    );
    ctx.restore();
  } catch {
    fillRoundRect(
      ctx,
      centerX - radius,
      centerY - radius,
      radius * 2,
      radius * 2,
      radius,
      fallbackColor,
    );
    ctx.font = font(24 * SCALE, "bold");
    ctx.fillStyle = COLORS.white;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initialChar, centerX, centerY);
  }

  ctx.save();
  ctx.shadowColor = withAlpha(COLORS.black, 0.1);
  ctx.shadowBlur = 10 * SCALE;
  ctx.shadowOffsetY = 4 * SCALE;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 2.5 * SCALE;
  ctx.stroke();
  ctx.restore();
}

export function drawStatBg(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  ctx.save();
  ctx.shadowColor = withAlpha(COLORS.black, 0.06);
  ctx.shadowBlur = 8 * SCALE;
  ctx.shadowOffsetY = 3 * SCALE;
  fillRoundRect(ctx, x, y, width, height, 10 * SCALE, COLORS.cards);
  ctx.restore();
}

export function drawStatValue(
  ctx: SKRSContext2D,
  value: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
): void {
  ctx.font = font(fontSize, "bold");
  ctx.fillStyle = color;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(value, x, y);
}

export function drawProgressBar(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number,
  trackColor: string,
  fillColor: string,
): void {
  fillRoundRect(ctx, x, y, width, height, height / 2, trackColor);
  const fillWidth = Math.max(width * Math.min(progress, 1), 0);
  if (fillWidth > 0) {
    fillRoundRect(ctx, x, y, fillWidth, height, height / 2, fillColor);
  }
}

export function drawXPText(
  ctx: SKRSContext2D,
  currentXp: number,
  requiredXp: number,
  x: number,
  y: number,
  fontSize: number,
  color: string,
): void {
  ctx.font = font(fontSize);
  ctx.fillStyle = color;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(`${String(currentXp)} / ${String(requiredXp)} XP`, x, y);
}

export function drawRemainingXP(
  ctx: SKRSContext2D,
  remainingXp: number,
  nextLevel: number,
  x: number,
  y: number,
  fontSize: number,
  color: string,
): void {
  ctx.font = font(fontSize);
  ctx.fillStyle = color;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(
    `${String(remainingXp)} XP until Level ${String(nextLevel)}`,
    x,
    y,
  );
}

export async function drawInventorySlot(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  emoji: string,
  quantity: number,
  cardColor: string,
  badgeColor: string,
): Promise<void> {
  ctx.save();
  ctx.shadowColor = withAlpha(COLORS.black, 0.06);
  ctx.shadowBlur = 6 * SCALE;
  ctx.shadowOffsetY = 2 * SCALE;
  fillRoundRect(ctx, x, y, width, height, 8 * SCALE, cardColor);
  ctx.restore();

  const emojiSize = 20 * SCALE;
  await drawEmoji(
    ctx,
    emoji,
    x + (width - emojiSize) / 2,
    y + (height - emojiSize) / 2,
    emojiSize,
  );

  if (quantity > 1) {
    const badgeLabel = String(Math.min(quantity, 99));
    const badgeRadius = 7 * SCALE;
    const badgeCx = x + width - badgeRadius - 3 * SCALE;
    const badgeCy = y + 3 * SCALE + badgeRadius;

    ctx.beginPath();
    ctx.arc(badgeCx, badgeCy, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = badgeColor;
    ctx.fill();

    ctx.font = font(8 * SCALE, "bold");
    ctx.fillStyle = COLORS.white;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeLabel, badgeCx, badgeCy);
  }
}

export function drawEmptySlot(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  fillRoundRect(
    ctx,
    x,
    y,
    width,
    height,
    8 * SCALE,
    withAlpha(COLORS.cards, 0.4),
  );
  ctx.font = font(16 * SCALE);
  ctx.fillStyle = withAlpha(COLORS.text, 0.12);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+", x + width / 2, y + height / 2);
}
