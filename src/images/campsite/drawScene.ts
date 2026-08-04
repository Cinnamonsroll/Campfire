import type { SKRSContext2D } from "@napi-rs/canvas";
import { drawEmoji } from "#src/images/shared/emoji.js";
import { roundRect } from "#src/images/shared/canvas.js";
import { SCALE, COLORS, withAlpha } from "#src/images/shared/layout.js";

async function groundEmoji(
  ctx: SKRSContext2D,
  emoji: string,
  centerX: number,
  footY: number,
  size: number,
): Promise<void> {
  await drawEmoji(ctx, emoji, centerX - size / 2, footY - size * 0.88, size);
}

export async function drawScene(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<void> {
  ctx.save();
  roundRect(ctx, x, y, width, height, 16 * SCALE);
  ctx.clip();

  const groundY = y + height * 0.55;

  const sky = ctx.createLinearGradient(x, y, x, groundY);
  sky.addColorStop(0, COLORS.skyTop);
  sky.addColorStop(1, COLORS.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, width, groundY - y);

  const sunCx = x + width - 70 * SCALE;
  const sunCy = y + 38 * SCALE;
  const sunRadius = 22 * SCALE;
  const glow = ctx.createRadialGradient(
    sunCx,
    sunCy,
    4 * SCALE,
    sunCx,
    sunCy,
    sunRadius * 2.4,
  );
  glow.addColorStop(0, withAlpha(COLORS.sun, 0.9));
  glow.addColorStop(1, withAlpha(COLORS.sun, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(
    sunCx - sunRadius * 2.4,
    sunCy - sunRadius * 2.4,
    sunRadius * 4.8,
    sunRadius * 4.8,
  );
  ctx.beginPath();
  ctx.arc(sunCx, sunCy, sunRadius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.sun;
  ctx.fill();

  const ground = ctx.createLinearGradient(x, groundY, x, y + height);
  ground.addColorStop(0, COLORS.groundTop);
  ground.addColorStop(1, COLORS.groundBottom);
  ctx.fillStyle = ground;
  ctx.fillRect(x, groundY, width, y + height - groundY);

  const footY = groundY + height * 0.42;

  await groundEmoji(ctx, "🌲", x + 38 * SCALE, footY, 44 * SCALE);
  await groundEmoji(ctx, "🌲", x + 94 * SCALE, footY, 40 * SCALE);
  await groundEmoji(ctx, "🌲", x + width - 80 * SCALE, footY, 44 * SCALE);
  await groundEmoji(ctx, "🌲", x + width - 36 * SCALE, footY, 38 * SCALE);

  await groundEmoji(ctx, "⛺", x + width / 2 - 14 * SCALE, footY, 68 * SCALE);

  await groundEmoji(ctx, "🔥", x + width / 2 + 56 * SCALE, footY, 34 * SCALE);
  await groundEmoji(ctx, "🪵", x + width / 2 + 22 * SCALE, footY, 26 * SCALE);
  await groundEmoji(ctx, "🎒", x + width / 2 - 72 * SCALE, footY, 26 * SCALE);

  await groundEmoji(ctx, "🌻", x + 148 * SCALE, footY, 22 * SCALE);
  await groundEmoji(ctx, "🌼", x + 330 * SCALE, footY, 22 * SCALE);

  ctx.restore();
}
