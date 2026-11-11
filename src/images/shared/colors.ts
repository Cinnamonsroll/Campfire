import { createCanvas } from "@napi-rs/canvas";
import { COLORS } from "./layout.js";
import { loadImageCached } from "./canvas.js";
import { logger } from "../../utils/logger.js";
import { reportError } from "../../utils/vanta.js";

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

const FALLBACK = hexToRgb(COLORS.fallback);
const QUANTUM = 32;
const SAMPLE_SIZE = 32;

const colorCache = new Map<string, RGB>();

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function rgbString({ r, g, b }: RGB): string {
  return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
}

export function darken(color: RGB, factor: number): RGB {
  return {
    r: clamp(color.r * factor),
    g: clamp(color.g * factor),
    b: clamp(color.b * factor),
  };
}

export async function extractHeaderColor(
  avatarUrl: string,
  accentColor?: number | null,
): Promise<RGB> {
  const fallback =
    accentColor == null
      ? FALLBACK
      : {
          r: (accentColor >> 16) & 0xff,
          g: (accentColor >> 8) & 0xff,
          b: accentColor & 0xff,
        };

  const cached = colorCache.get(avatarUrl);
  if (cached) return cached;

  try {
    const img = await loadImageCached(avatarUrl);
    const canvas = createCanvas(SAMPLE_SIZE, SAMPLE_SIZE);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;

    const colors = new Map<number, { total: RGB; count: number }>();

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      const color = { r: data[i], g: data[i + 1], b: data[i + 2] };

      const key =
        Math.floor(data[i] / QUANTUM) * 1_000_000 +
        Math.floor(data[i + 1] / QUANTUM) * 1_000 +
        Math.floor(data[i + 2] / QUANTUM);
      const entry = colors.get(key);
      if (entry) {
        entry.count++;
        entry.total.r += color.r;
        entry.total.g += color.g;
        entry.total.b += color.b;
      } else {
        colors.set(key, {
          total: color,
          count: 1,
        });
      }
    }

    let best: RGB = fallback;
    let bestScore = 0;
    for (const entry of colors.values()) {
      const color = {
        r: entry.total.r / entry.count,
        g: entry.total.g / entry.count,
        b: entry.total.b / entry.count,
      };

      const score = entry.count;
      if (score > bestScore) {
        best = color;
        bestScore = score;
      }
    }

    const result: RGB = {
      r: clamp(best.r),
      g: clamp(best.g),
      b: clamp(best.b),
    };
    if (bestScore === 0) return fallback;

    colorCache.set(avatarUrl, result);
    setTimeout(() => colorCache.delete(avatarUrl), 3 * 3600 * 1000);

    return result;
  } catch (error) {
    logger.error(error, "Failed to extract avatar color");
    reportError(error);
    return fallback;
  }
}
