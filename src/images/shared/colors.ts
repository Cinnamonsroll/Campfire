import { createCanvas } from "@napi-rs/canvas";
import { COLORS } from "./layout.js";
import { loadImageCached } from "./canvas.js";
import { logger } from "../../utils/logger.js";

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

function luminance({ r, g, b }: RGB): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function saturation({ r, g, b }: RGB): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function quantize(v: number, step: number): number {
  return Math.round(v / step) * step;
}

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
  if (accentColor !== undefined && accentColor !== null) {
    return {
      r: (accentColor >> 16) & 0xff,
      g: (accentColor >> 8) & 0xff,
      b: accentColor & 0xff,
    };
  }

  const cached = colorCache.get(avatarUrl);
  if (cached) return cached;

  try {
    const img = await loadImageCached(avatarUrl);
    const canvas = createCanvas(SAMPLE_SIZE, SAMPLE_SIZE);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;

    const colors = new Map<
      number,
      { total: RGB; count: number; saturation: number }
    >();

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      const color = { r: data[i], g: data[i + 1], b: data[i + 2] };
      const lum = luminance(color);
      if (lum < 18 || lum > 242) continue;

      const key =
        quantize(data[i], QUANTUM) * 1_000_000 +
        quantize(data[i + 1], QUANTUM) * 1_000 +
        quantize(data[i + 2], QUANTUM);
      const entry = colors.get(key);
      if (entry) {
        entry.count++;
        entry.total.r += color.r;
        entry.total.g += color.g;
        entry.total.b += color.b;
        entry.saturation += saturation(color);
      } else {
        colors.set(key, {
          total: color,
          count: 1,
          saturation: saturation(color),
        });
      }
    }

    let best: RGB = FALLBACK;
    let bestScore = 0;
    for (const entry of colors.values()) {
      const color = {
        r: entry.total.r / entry.count,
        g: entry.total.g / entry.count,
        b: entry.total.b / entry.count,
      };
      const colorSaturation = entry.saturation / entry.count;
      const score = entry.count * (0.15 + colorSaturation ** 2 * 3);
      if (score > bestScore) {
        best = color;
        bestScore = score;
      }
    }

    if (saturation(best) < 0.08 || bestScore === 0) {
      best = FALLBACK;
    } else if (luminance(best) > 180) {
      best = darken(best, 140 / luminance(best));
    }

    const result: RGB = {
      r: clamp(best.r),
      g: clamp(best.g),
      b: clamp(best.b),
    };
    colorCache.set(avatarUrl, result);
    return result;
  } catch (error) {
    logger.error(error, "Failed to extract avatar color");
    colorCache.set(avatarUrl, FALLBACK);
    return FALLBACK;
  }
}
