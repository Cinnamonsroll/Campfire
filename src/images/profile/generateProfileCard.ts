import { createCanvas } from "@napi-rs/canvas";
import type { CardData } from "#src/images/types/index.js";
import {
  darken,
  extractHeaderColor,
  rgbString,
} from "#src/images/shared/colors.js";
import {
  roundRect,
  drawAvatar,
  drawStatBg,
  drawStatValue,
  drawProgressBar,
  drawXPText,
  drawRemainingXP,
  drawInventorySlot,
  drawEmptySlot,
} from "#src/images/shared/canvas.js";
import { prefetchEmojis } from "#src/images/shared/emoji.js";
import { SCALE, COLORS, withAlpha } from "#src/images/shared/layout.js";
import { font } from "#src/images/shared/typography.js";

const CARD_WIDTH = 640 * SCALE;
const LEFT_PANEL_WIDTH = 220 * SCALE;
const RIGHT_PANEL_WIDTH = CARD_WIDTH - LEFT_PANEL_WIDTH;
const LEFT_MARGIN = 12 * SCALE;
const RIGHT_MARGIN = 14 * SCALE;
const LEFT_CONTENT = LEFT_PANEL_WIDTH - LEFT_MARGIN * 2;
const RIGHT_CONTENT = RIGHT_PANEL_WIDTH - RIGHT_MARGIN * 2;

interface LayoutMetrics {
  cardHeight: number;
  headerHeight: number;
  avatarRadius: number;
  avatarCenterY: number;
  nameY: number;
  titleY: number;
  statCardY: number;
  statCardHeight: number;
  statCardWidth: number;
  statCardGap: number;
  xpLabelY: number;
  progressBarY: number;
  progressBarHeight: number;
  remainingY: number;
  inventoryTitleY: number;
  inventoryGridY: number;
  slotHeight: number;
  slotGap: number;
  slotWidth: number;
}

function computeLayout(): LayoutMetrics {
  const headerHeight = Math.round(LEFT_PANEL_WIDTH * 0.39);
  const avatarRadius = 22 * SCALE;
  const avatarCenterY = headerHeight - 8 * SCALE;
  const nameY = avatarCenterY + avatarRadius + 10 * SCALE;
  const titleY = nameY + 16 * SCALE;
  const statCardY = titleY + 16 * SCALE;
  const statCardHeight = 36 * SCALE;
  const statCardWidth = (LEFT_CONTENT - 12 * SCALE) / 2;
  const statCardGap = 12 * SCALE;

  const xpLabelY = 16 * SCALE;
  const progressBarY = xpLabelY + 14 * SCALE;
  const progressBarHeight = 8 * SCALE;
  const remainingY = progressBarY + progressBarHeight + 3 * SCALE;
  const inventoryTitleY = remainingY + 16 * SCALE;
  const slotHeight = 44 * SCALE;
  const slotGap = 6 * SCALE;
  const inventoryGridY = inventoryTitleY + 22 * SCALE;
  const slotWidth = (RIGHT_CONTENT - slotGap * 5) / 6;

  const leftBottom = statCardY + statCardHeight + 12 * SCALE;
  const rightBottom = inventoryGridY + slotHeight * 2 + slotGap + 12 * SCALE;
  const cardHeight = Math.max(leftBottom, rightBottom);

  return {
    cardHeight,
    headerHeight,
    avatarRadius,
    avatarCenterY,
    nameY,
    titleY,
    statCardY,
    statCardHeight,
    statCardWidth,
    statCardGap,
    xpLabelY,
    progressBarY,
    progressBarHeight,
    remainingY,
    inventoryTitleY,
    inventoryGridY,
    slotHeight,
    slotGap,
    slotWidth,
  };
}

export async function generateCamperCard(data: CardData): Promise<Buffer> {
  await prefetchEmojis(
    data.inventory.map((item) => item.emoji),
    20 * SCALE,
  );

  const layout = computeLayout();
  const headerColor = await extractHeaderColor(
    data.avatarUrl,
    data.accentColor,
  );
  const headerColorString = rgbString(headerColor);

  const canvas = createCanvas(CARD_WIDTH, layout.cardHeight);
  const ctx = canvas.getContext("2d");

  roundRect(ctx, 0, 0, CARD_WIDTH, layout.cardHeight, 14 * SCALE);
  ctx.clip();

  ctx.fillStyle = COLORS.body;
  ctx.fillRect(0, 0, CARD_WIDTH, layout.cardHeight);

  const headerGradient = ctx.createLinearGradient(0, 0, 0, layout.headerHeight);
  headerGradient.addColorStop(0, headerColorString);
  headerGradient.addColorStop(0.4, rgbString(darken(headerColor, 0.93)));
  headerGradient.addColorStop(0.75, rgbString(darken(headerColor, 0.85)));
  headerGradient.addColorStop(1, rgbString(darken(headerColor, 0.78)));
  ctx.fillStyle = headerGradient;
  ctx.fillRect(0, 0, LEFT_PANEL_WIDTH, layout.headerHeight);

  const seamBlend = ctx.createLinearGradient(
    0,
    layout.headerHeight - 10 * SCALE,
    0,
    layout.headerHeight + 16 * SCALE,
  );
  seamBlend.addColorStop(0, withAlpha(COLORS.black, 0.06));
  seamBlend.addColorStop(0.6, withAlpha(COLORS.black, 0.015));
  seamBlend.addColorStop(1, withAlpha(COLORS.black, 0));
  ctx.fillStyle = seamBlend;
  ctx.fillRect(
    0,
    layout.headerHeight - 10 * SCALE,
    LEFT_PANEL_WIDTH,
    26 * SCALE,
  );

  const panelDividerShadow = ctx.createLinearGradient(
    LEFT_PANEL_WIDTH,
    0,
    LEFT_PANEL_WIDTH + 3 * SCALE,
    0,
  );
  panelDividerShadow.addColorStop(0, withAlpha(COLORS.black, 0.04));
  panelDividerShadow.addColorStop(1, withAlpha(COLORS.black, 0));
  ctx.fillStyle = panelDividerShadow;
  ctx.fillRect(LEFT_PANEL_WIDTH, 0, 3 * SCALE, layout.cardHeight);

  const leftCenterX = LEFT_PANEL_WIDTH / 2;
  await drawAvatar(
    ctx,
    data.avatarUrl,
    leftCenterX,
    layout.avatarCenterY,
    layout.avatarRadius,
    headerColorString,
    data.characterName.charAt(0).toUpperCase(),
  );

  ctx.font = font(16 * SCALE, "bold");
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(data.characterName, leftCenterX, layout.nameY);

  ctx.font = font(10 * SCALE);
  ctx.fillStyle = COLORS.title;
  ctx.fillText(data.title, leftCenterX, layout.titleY);

  drawStatBg(
    ctx,
    LEFT_MARGIN,
    layout.statCardY,
    layout.statCardWidth,
    layout.statCardHeight,
  );
  ctx.font = font(9 * SCALE);
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Coins", LEFT_MARGIN + 10 * SCALE, layout.statCardY + 9 * SCALE);
  drawStatValue(
    ctx,
    String(data.coins),
    LEFT_MARGIN + layout.statCardWidth - 8 * SCALE,
    layout.statCardY + layout.statCardHeight - 6 * SCALE,
    14 * SCALE,
    COLORS.text,
  );

  drawStatBg(
    ctx,
    LEFT_MARGIN + layout.statCardWidth + layout.statCardGap,
    layout.statCardY,
    layout.statCardWidth,
    layout.statCardHeight,
  );
  ctx.font = font(9 * SCALE);
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(
    "Level",
    LEFT_MARGIN + layout.statCardWidth + layout.statCardGap + 10 * SCALE,
    layout.statCardY + 9 * SCALE,
  );
  drawStatValue(
    ctx,
    String(data.level),
    LEFT_MARGIN +
      layout.statCardWidth +
      layout.statCardGap +
      layout.statCardWidth -
      8 * SCALE,
    layout.statCardY + layout.statCardHeight - 6 * SCALE,
    14 * SCALE,
    COLORS.accent,
  );

  const rightPanelX = LEFT_PANEL_WIDTH + RIGHT_MARGIN;

  ctx.font = font(11 * SCALE);
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Experience", rightPanelX, layout.xpLabelY);

  drawXPText(
    ctx,
    data.xp,
    data.xpRequired,
    rightPanelX + RIGHT_CONTENT,
    layout.xpLabelY,
    11 * SCALE,
    COLORS.accent,
  );

  const experienceProgress =
    data.xpRequired > 0 ? data.xp / data.xpRequired : 0;
  drawProgressBar(
    ctx,
    rightPanelX,
    layout.progressBarY,
    RIGHT_CONTENT,
    layout.progressBarHeight,
    experienceProgress,
    COLORS.barTrack,
    COLORS.accent,
  );

  const remainingXp = Math.max(data.xpRequired - data.xp, 0);
  drawRemainingXP(
    ctx,
    remainingXp,
    data.level + 1,
    rightPanelX + RIGHT_CONTENT,
    layout.remainingY,
    11 * SCALE,
    COLORS.accent,
  );

  ctx.font = font(11 * SCALE);
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Inventory", rightPanelX, layout.inventoryTitleY);

  for (let slotIndex = 0; slotIndex < 12; slotIndex++) {
    const column = slotIndex % 6;
    const row = Math.floor(slotIndex / 6);
    const slotX = rightPanelX + column * (layout.slotWidth + layout.slotGap);
    const slotY =
      layout.inventoryGridY + row * (layout.slotHeight + layout.slotGap);

    if (slotIndex < data.inventory.length) {
      await drawInventorySlot(
        ctx,
        slotX,
        slotY,
        layout.slotWidth,
        layout.slotHeight,
        data.inventory[slotIndex].emoji,
        data.inventory[slotIndex].quantity,
        COLORS.cards,
        COLORS.badge,
      );
    } else {
      drawEmptySlot(ctx, slotX, slotY, layout.slotWidth, layout.slotHeight);
    }
  }

  return Buffer.from(await canvas.encode("png"));
}
