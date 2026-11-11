import { createCanvas, type Canvas } from "@napi-rs/canvas";
import type { CardData } from "../types/index.js";
import { extractHeaderColor, rgbString } from "../shared/colors.js";
import {
  roundRect,
  drawAvatarBackdrop,
  drawStatBg,
  drawStatValue,
  drawProgressBar,
  drawXPText,
  drawRemainingXP,
  drawInventorySlot,
  drawEmptySlot,
} from "../shared/canvas.js";
import { prefetchEmojis } from "../shared/emoji.js";
import { SCALE, PROFILE_SCALE, COLORS, withAlpha } from "../shared/layout.js";
import { font } from "../shared/typography.js";

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

export function profileAvatarPlacement(): {
  x: number;
  y: number;
  size: number;
} {
  const layout = computeLayout();
  return {
    x: (LEFT_PANEL_WIDTH / 2 - layout.avatarRadius) / SCALE,
    y: (layout.avatarCenterY - layout.avatarRadius) / SCALE,
    size: (layout.avatarRadius * 2) / SCALE,
  };
}

export async function renderCamperCardCanvas(
  data: CardData,
  outputScale = PROFILE_SCALE,
): Promise<Canvas> {
  const layout = computeLayout();
  const [headerColor] = await Promise.all([
    extractHeaderColor(data.avatarUrl, data.accentColor),
    prefetchEmojis(
      data.inventory.map((item) => item.emoji),
      20 * SCALE,
    ),
  ]);
  const headerColorString = rgbString(headerColor);

  const canvas = createCanvas(
    Math.round((CARD_WIDTH * outputScale) / SCALE),
    Math.round((layout.cardHeight * outputScale) / SCALE),
  );
  const ctx = canvas.getContext("2d");
  ctx.scale(outputScale / SCALE, outputScale / SCALE);
  ctx.imageSmoothingEnabled = false;

  roundRect(ctx, 0, 0, CARD_WIDTH, layout.cardHeight, 14 * SCALE);
  ctx.clip();

  ctx.fillStyle = COLORS.body;
  ctx.fillRect(0, 0, CARD_WIDTH, layout.cardHeight);

  // Apply the same frosted tint throughout, including the edge at the avatar.
  ctx.fillStyle = headerColorString;
  ctx.fillRect(0, 0, LEFT_PANEL_WIDTH, layout.headerHeight);
  ctx.fillStyle = withAlpha(COLORS.white, 0.12);
  ctx.fillRect(0, 0, LEFT_PANEL_WIDTH, layout.headerHeight);

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
  drawAvatarBackdrop(
    ctx,
    leftCenterX,
    layout.avatarCenterY,
    layout.avatarRadius,
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

  return canvas;
}
