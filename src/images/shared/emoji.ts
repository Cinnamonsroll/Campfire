import { loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import { parse } from "@twemoji/parser";

const parseCache = new Map<string, ReturnType<typeof parse>>();
const svgCache = new Map<string, string>();
const imageCache = new Map<
  string,
  Promise<Awaited<ReturnType<typeof loadImage>>>
>();

function sizedSvg(svg: string, size: number): string {
  const renderSize = Math.ceil(size);
  return svg
    .replace(/\s+width="[^"]*"/, "")
    .replace(/\s+height="[^"]*"/, "")
    .replace(
      /<svg([^>]*)>/,
      `<svg$1 width="${String(renderSize)}" height="${String(renderSize)}">`,
    );
}

async function loadEmoji(
  emoji: string,
  size: number,
): Promise<Awaited<ReturnType<typeof loadImage>> | null> {
  let entities = parseCache.get(emoji);
  if (!entities) {
    entities = parse(emoji);
    if (entities.length === 0) return null;
    parseCache.set(emoji, entities);
  }

  const url = entities[0].url;
  const cacheKey = `${url}@${String(size)}`;
  let image = imageCache.get(cacheKey);
  if (!image) {
    image = (async () => {
      let svg = svgCache.get(url);
      if (!svg) {
        svg = await (await fetch(url)).text();
        svgCache.set(url, svg);
      }
      return loadImage(Buffer.from(sizedSvg(svg, size)));
    })();
    imageCache.set(cacheKey, image);
  }

  try {
    return await image;
  } catch (error) {
    imageCache.delete(cacheKey);
    throw error;
  }
}

export async function prefetchEmojis(
  emojis: readonly string[],
  size: number,
): Promise<void> {
  await Promise.all(
    [...new Set(emojis)].map((emoji) => loadEmoji(emoji, size)),
  );
}

export async function drawEmoji(
  ctx: SKRSContext2D,
  emoji: string,
  x: number,
  y: number,
  size: number,
): Promise<void> {
  const image = await loadEmoji(emoji, size);
  if (!image) return;

  ctx.drawImage(image, x, y, size, size);
}
