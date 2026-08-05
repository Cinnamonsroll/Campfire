import { SKRSContext2D, createCanvas } from "@napi-rs/canvas";
import {
  fillRoundRect,
  drawProgressBar,
  drawAvatar,
  loadImageCached,
} from "../shared/canvas.js";
import { drawEmoji, prefetchEmojis } from "../shared/emoji.js";
import { SCALE, withAlpha, COLORS } from "../shared/layout.js";
import { font } from "../shared/typography.js";
import { StatisticCardData, StatisticsCardData } from "../types/index.js";

const CARD_WIDTH = 640 * SCALE;
const PADDING = 18 * SCALE;
const HEADER_HEIGHT = 78 * SCALE;
const FOOTER_HEIGHT = 38 * SCALE;
const GRID_COLUMNS = 3;
const GRID_GAP = 12 * SCALE;
const TILE_HEIGHT = 92 * SCALE;
const MAX_STATISTICS = 9;

const TILE_WIDTH =
  (CARD_WIDTH - PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
const GRID_ROWS = Math.ceil(MAX_STATISTICS / GRID_COLUMNS);
const CARD_HEIGHT =
  PADDING +
  HEADER_HEIGHT +
  GRID_ROWS * TILE_HEIGHT +
  (GRID_ROWS - 1) * GRID_GAP +
  FOOTER_HEIGHT;

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");
const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatValue(value: number, unit: string | null): string {
  const number =
    Math.abs(value) >= 10_000
      ? COMPACT_NUMBER_FORMATTER.format(value)
      : NUMBER_FORMATTER.format(value);
  return `${number}${unit ?? ""}`;
}

function drawTileBackground(ctx: SKRSContext2D, x: number, y: number): void {
  ctx.save();
  ctx.shadowColor = withAlpha(COLORS.black, 0.06);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 3 * SCALE;
  fillRoundRect(ctx, x, y, TILE_WIDTH, TILE_HEIGHT, 12 * SCALE, COLORS.card);
  ctx.restore();
}

async function drawStatisticTile(
  ctx: SKRSContext2D,
  statistic: StatisticCardData,
  x: number,
  y: number,
): Promise<void> {
  drawTileBackground(ctx, x, y);

  const emojiSize = 22 * SCALE;
  await drawEmoji(
    ctx,
    statistic.emoji,
    x + 14 * SCALE,
    y + 14 * SCALE,
    emojiSize,
  );

  ctx.font = font(10 * SCALE, "bold");
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(statistic.label, x + 44 * SCALE, y + 18 * SCALE);

  ctx.font = font(22 * SCALE, "bold");
  ctx.fillStyle = COLORS.campAccent;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(
    formatValue(statistic.value, statistic.unit),
    x + TILE_WIDTH - 14 * SCALE,
    y + TILE_HEIGHT - 16 * SCALE,
  );

  if (statistic.unit === "%") {
    drawProgressBar(
      ctx,
      x + 14 * SCALE,
      y + TILE_HEIGHT - 12 * SCALE,
      TILE_WIDTH - 28 * SCALE,
      4 * SCALE,
      statistic.value / 100,
      COLORS.statTrack,
      COLORS.campAccent,
    );
  }
}

export async function generateStatisticsCard(
  data: StatisticsCardData,
): Promise<Buffer> {
  await Promise.all([
    prefetchEmojis(
      data.statistics
        .slice(0, MAX_STATISTICS)
        .map((statistic) => statistic.emoji),
      22 * SCALE,
    ),
    loadImageCached(data.avatarUrl),
  ]);

  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  fillRoundRect(
    ctx,
    0,
    0,
    CARD_WIDTH,
    CARD_HEIGHT,
    20 * SCALE,
    COLORS.campBody,
  );

  await drawAvatar(
    ctx,
    data.avatarUrl,
    PADDING + 36 * SCALE,
    PADDING + HEADER_HEIGHT / 2,
    30 * SCALE,
    COLORS.campAccent,
    data.characterName.charAt(0).toUpperCase(),
  );

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = font(22 * SCALE, "bold");
  ctx.fillStyle = COLORS.text;
  ctx.fillText(
    `${data.characterName}'s Statistics`,
    PADDING + 80 * SCALE,
    PADDING + HEADER_HEIGHT / 2,
  );

  const gridY = PADDING + HEADER_HEIGHT;
  for (const [index, statistic] of data.statistics
    .slice(0, MAX_STATISTICS)
    .entries()) {
    const column = index % GRID_COLUMNS;
    const row = Math.floor(index / GRID_COLUMNS);
    await drawStatisticTile(
      ctx,
      statistic,
      PADDING + column * (TILE_WIDTH + GRID_GAP),
      gridY + row * (TILE_HEIGHT + GRID_GAP),
    );
  }

  ctx.font = font(10 * SCALE);
  ctx.fillStyle = COLORS.eyebrow;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(
    "Campfire keeps the stories. You make them.",
    CARD_WIDTH / 2,
    CARD_HEIGHT - FOOTER_HEIGHT + 12 * SCALE,
  );

  return Buffer.from(await canvas.encode("png"));
}
