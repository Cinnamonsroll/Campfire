import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import { fillRoundRect } from "../shared/canvas.js";
import { drawEmoji, prefetchEmojis } from "../shared/emoji.js";
import { SCALE, COLORS, withAlpha } from "../shared/layout.js";
import { font } from "../shared/typography.js";
import type { ShopCardData, ShopItemCardData } from "../types/index.js";

const SHOP_WIDTH = 640 * SCALE;
const PADDING = 24 * SCALE;
const HEADER_HEIGHT = 110 * SCALE;
const FOOTER_HEIGHT = 40 * SCALE;

const GRID_COLS = 4;
const GRID_GAP = 12 * SCALE;

const TILE_WIDTH =
  (SHOP_WIDTH - PADDING * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
const TILE_HEIGHT = 156 * SCALE;
const GRID_HEIGHT = TILE_HEIGHT * 2 + GRID_GAP;
const CARD_HEIGHT = PADDING + HEADER_HEIGHT + GRID_HEIGHT + FOOTER_HEIGHT;

const RARITY_BG = {
  common: COLORS.card,
  uncommon: COLORS.upgradeBg,
  rare: "#F8DCC8",
} as const;

const ENERGY_BG = "#FFF3CF";
const SOLD_OUT_LABEL = "Sold out";

function itemBackground(item: ShopItemCardData): string {
  if (item.isEnergyItem) return ENERGY_BG;
  return RARITY_BG[item.rarity];
}

function wrapText(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      if (lines.length >= maxLines) return lines;
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

async function drawCoinPill(
  ctx: SKRSContext2D,
  amount: number,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<void> {
  fillRoundRect(ctx, x, y, width, height, height / 2, COLORS.campAccent);
  const emojiSize = 10 * SCALE;
  const gap = 6 * SCALE;
  const text = String(amount);
  ctx.font = font(9.5 * SCALE, "bold");
  const textWidth = ctx.measureText(text).width;
  const contentStart = x + (width - (emojiSize + gap + textWidth)) / 2;
  await drawEmoji(
    ctx,
    "🪙",
    contentStart,
    y + (height - emojiSize) / 2,
    emojiSize,
  );
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, contentStart + emojiSize + gap, y + height / 2);
}

async function drawShopItemTile(
  ctx: SKRSContext2D,
  item: ShopItemCardData,
  x: number,
  y: number,
): Promise<void> {
  const soldOut = item.remaining <= 0;
  const background = soldOut
    ? withAlpha(itemBackground(item), 0.45)
    : itemBackground(item);

  ctx.save();
  ctx.shadowColor = withAlpha(COLORS.black, 0.06);
  ctx.shadowBlur = 6 * SCALE;
  ctx.shadowOffsetY = 2 * SCALE;
  fillRoundRect(ctx, x, y, TILE_WIDTH, TILE_HEIGHT, 10 * SCALE, background);
  ctx.restore();

  const centerX = x + TILE_WIDTH / 2;
  const textMaxWidth = TILE_WIDTH - 16 * SCALE;

  const emojiSize = 28 * SCALE;
  await drawEmoji(
    ctx,
    item.emoji,
    centerX - emojiSize / 2,
    y + 12 * SCALE,
    emojiSize,
  );

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  let cursorY = y + 46 * SCALE;

  ctx.font = font(12 * SCALE, "bold");
  ctx.fillStyle = soldOut ? withAlpha(COLORS.text, 0.45) : COLORS.text;
  const nameLines = wrapText(ctx, item.name, textMaxWidth, 2);
  for (const line of nameLines) {
    ctx.fillText(line, centerX, cursorY);
    cursorY += 13 * SCALE;
  }

  ctx.font = font(9.5 * SCALE);
  ctx.fillStyle = soldOut ? withAlpha(COLORS.muted, 0.45) : COLORS.muted;
  const descLines = wrapText(ctx, item.description, textMaxWidth, 2);
  for (const line of descLines) {
    ctx.fillText(line, centerX, cursorY);
    cursorY += 10.5 * SCALE;
  }

  ctx.font = font(8.5 * SCALE);
  ctx.fillStyle = soldOut
    ? withAlpha(COLORS.mutedLight, 0.45)
    : COLORS.mutedLight;
  const flavorLines = wrapText(ctx, item.flavor, textMaxWidth, 2);
  for (const line of flavorLines) {
    ctx.fillText(line, centerX, cursorY);
    cursorY += 9.5 * SCALE;
  }

  const pillWidth = 54 * SCALE;
  const pillHeight = 16 * SCALE;
  const pillX = centerX - pillWidth / 2;
  const pillY = y + TILE_HEIGHT - pillHeight - 10 * SCALE;

  if (soldOut) {
    ctx.font = font(10 * SCALE, "bold");
    ctx.fillStyle = COLORS.eyebrow;
    ctx.fillText(SOLD_OUT_LABEL, centerX, y + TILE_HEIGHT - 26 * SCALE);
  } else {
    await drawCoinPill(ctx, item.price, pillX, pillY, pillWidth, pillHeight);
    if (item.remaining > 1) {
      ctx.font = font(8 * SCALE);
      ctx.fillStyle = COLORS.eyebrow;
      ctx.fillText(
        `${String(item.remaining)} left`,
        centerX,
        pillY - 10 * SCALE,
      );
    }
  }
}

export async function generateShopCard(data: ShopCardData): Promise<Buffer> {
  await Promise.all([
    prefetchEmojis(
      data.items.map((item) => item.emoji),
      28 * SCALE,
    ),
    prefetchEmojis(["ðŸª™"], 10 * SCALE),
  ]);

  const canvas = createCanvas(SHOP_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  fillRoundRect(
    ctx,
    0,
    0,
    SHOP_WIDTH,
    CARD_HEIGHT,
    20 * SCALE,
    COLORS.campBody,
  );

  ctx.font = font(26 * SCALE, "bold");
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Camp General Store", SHOP_WIDTH / 2, PADDING + 4 * SCALE);

  ctx.font = font(13 * SCALE);
  ctx.fillStyle = COLORS.title;
  ctx.fillText(
    "Fresh supplies arrived this morning.",
    SHOP_WIDTH / 2,
    PADDING + 36 * SCALE,
  );

  ctx.font = font(11 * SCALE);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(data.refreshLabel, SHOP_WIDTH / 2, PADDING + 56 * SCALE);

  const coinPillWidth = 84 * SCALE;
  const coinPillHeight = 22 * SCALE;
  const coinPillX = SHOP_WIDTH - PADDING - coinPillWidth;
  await drawCoinPill(
    ctx,
    data.coins,
    coinPillX,
    PADDING + 2 * SCALE,
    coinPillWidth,
    coinPillHeight,
  );

  const gridX = PADDING;
  const gridY = PADDING + HEADER_HEIGHT;

  for (let index = 0; index < data.items.length; index++) {
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);
    const x = gridX + col * (TILE_WIDTH + GRID_GAP);
    const y = gridY + row * (TILE_HEIGHT + GRID_GAP);
    await drawShopItemTile(ctx, data.items[index], x, y);
  }

  ctx.font = font(11 * SCALE);
  ctx.fillStyle = COLORS.eyebrow;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(
    "New stock arrives at midnight",
    SHOP_WIDTH / 2,
    gridY + GRID_HEIGHT + 12 * SCALE,
  );

  return Buffer.from(await canvas.encode("png"));
}
