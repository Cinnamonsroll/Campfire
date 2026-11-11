import type { ReadableStream } from "node:stream/web";
import { createCanvas, type Canvas } from "@napi-rs/canvas";
import { Animation, Frame, Image } from "imagescript";
import {
  renderCamperCardCanvas,
  profileAvatarPlacement,
} from "./generateProfileCard.js";
import {
  renderStatisticsCardCanvas,
  statisticsAvatarPlacement,
} from "../statistics/generateStatisticsCard.js";
import type { CardData, StatisticsCardData } from "../types/index.js";
import { loadImageCached } from "../shared/canvas.js";
import { logger } from "../../utils/logger.js";

import { PROFILE_SCALE } from "../shared/layout.js";
const MAX_DOWNLOAD = 8 * 1024 * 1024;
const MAX_PIXELS = 8_000_000;
const MAX_FRAMES = 60;
const STEP_MS = 100;

export interface ProfileAssets {
  avatarUrl: string;
  staticAvatarUrl?: string;
  decorationUrl?: string | null;
}
export interface ProfileCard {
  buffer: Buffer;
  extension: "png" | "webp";
  notes: string[];
}
interface Placement {
  x: number;
  y: number;
  size: number;
}

async function fetchAsset(url: string): Promise<Uint8Array> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok || !response.body)
    throw new Error(
      `Profile asset request failed (${String(response.status)})`,
    );
  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_DOWNLOAD) throw new Error("Profile asset exceeds 8 MiB");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks);
}

// URL hashes change with Discord assets; short caching also coalesces concurrent requests.
const downloadCache = new Map<
  string,
  { promise: Promise<Uint8Array>; expires: number; size: number }
>();
const MAX_CACHED_BYTES = 24 * 1024 * 1024;
function download(url: string): Promise<Uint8Array> {
  const cached = downloadCache.get(url);
  if (cached && cached.expires > Date.now()) return cached.promise;
  if (cached) downloadCache.delete(url);
  const entry: { promise: Promise<Uint8Array>; expires: number; size: number } =
    {
      promise: Promise.resolve(new Uint8Array()),
      expires: Date.now() + 60_000,
      size: 0,
    };
  entry.promise = fetchAsset(url)
    .then((bytes) => {
      entry.size = bytes.byteLength;
      let size = 0;
      for (const item of downloadCache.values()) size += item.size;
      for (const [key, item] of downloadCache) {
        if (size <= MAX_CACHED_BYTES && downloadCache.size <= 16) break;
        downloadCache.delete(key);
        size -= item.size;
      }
      return bytes;
    })
    .catch((error: unknown) => {
      if (downloadCache.get(url) === entry) downloadCache.delete(url);
      throw error;
    });
  downloadCache.set(url, entry);
  return entry.promise;
}

export async function decodeProfileAsset(
  bytes: Uint8Array,
): Promise<Animation> {
  return Animation.decode(bytes, { maxPixels: MAX_PIXELS, threads: 1 });
}

const timings = new WeakMap<
  Animation,
  { durations: number[]; total: number }
>();
function timing(animation: Animation): { durations: number[]; total: number } {
  let cached = timings.get(animation);
  if (!cached) {
    const durations = animation.frames.map((frame) =>
      Math.max(20, frame.duration),
    );
    cached = {
      durations,
      total: durations.reduce((sum, value) => sum + value, 0),
    };
    timings.set(animation, cached);
  }
  return cached;
}
export function frameAt(animation: Animation, time: number): Frame {
  const { durations, total } = timing(animation);
  let position = time % total;
  for (let i = 0; i < durations.length; i++) {
    if (position < durations[i]) return animation.frames[i];
    position -= durations[i];
  }
  return animation.frames[animation.frames.length - 1];
}

/** Nearest-neighbor resize and a binary circular mask, without antialiased edges. */
export function prepareAvatar(frame: Frame, size: number): Image {
  const image = frame.clone().cover(size, size, { mode: "nearest-neighbor" });
  const center = size / 2,
    radiusSquared = center * center;
  for (let y = 0; y < size; y++) {
    const dy = y + 0.5 - center;
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - center;
      if (dx * dx + dy * dy > radiusSquared)
        image.bitmap[(y * size + x) * 4 + 3] = 0;
    }
  }
  return image;
}

/** Encode the full card once, then just the small region around the avatar. */
export async function compositeProfileCard(
  base: Image,
  avatar: Animation,
  decoration: Animation | null,
  placement: Placement,
  maxBytes = MAX_DOWNLOAD,
): Promise<ProfileCard> {
  const notes: string[] = [];
  const size = Math.round(placement.size);
  const decorationSize = Math.round(size * 1.2);
  const padding = Math.ceil((decorationSize - size) / 2);
  const left = Math.max(0, Math.floor((placement.x - padding) / 2) * 2);
  const top = Math.max(0, Math.floor((placement.y - padding) / 2) * 2);
  const right = Math.min(base.width, Math.ceil(placement.x + size + padding));
  const bottom = Math.min(base.height, Math.ceil(placement.y + size + padding));
  const background = base.region(left, top, right - left, bottom - top);
  const preparedAvatars = new Map<Frame, Image>();
  const preparedDecorations = new Map<Frame, Image>();
  const animated =
    avatar.frames.length > 1 || (decoration?.frames.length ?? 0) > 1;
  const duration = Math.max(
    avatar.frames.length > 1 ? timing(avatar).total : 0,
    decoration && decoration.frames.length > 1 ? timing(decoration).total : 0,
  );
  const count = animated
    ? Math.min(MAX_FRAMES, Math.max(2, Math.ceil(duration / STEP_MS)))
    : 1;
  const frameDuration = animated
    ? Math.max(
        20,
        Math.round(Math.min(duration, MAX_FRAMES * STEP_MS) / count / 10) * 10,
      )
    : STEP_MS;
  const drawPatch = (
    avatarFrame: Frame,
    decorationFrame: Frame | undefined,
  ): Image => {
    let image = preparedAvatars.get(avatarFrame);
    if (!image) {
      image = prepareAvatar(avatarFrame, size);
      preparedAvatars.set(avatarFrame, image);
    }
    const patch = background.clone().composite(image, {
      x: Math.round(placement.x) - left,
      y: Math.round(placement.y) - top,
    });
    if (decorationFrame) {
      let overlay = preparedDecorations.get(decorationFrame);
      if (!overlay) {
        overlay = decorationFrame.clone().resize({
          width: decorationSize,
          height: decorationSize,
          mode: "nearest-neighbor",
        });
        preparedDecorations.set(decorationFrame, overlay);
      }
      patch.composite(overlay, {
        x: Math.round(placement.x - (decorationSize - size) / 2) - left,
        y: Math.round(placement.y - (decorationSize - size) / 2) - top,
      });
    }
    return patch;
  };
  // Merge repeated samples before resizing/compositing or encoding any pixels.
  const samples: { avatar: Frame; decoration?: Frame; duration: number }[] = [];
  for (let i = 0; i < count; i++) {
    const next = {
      avatar: frameAt(avatar, i * frameDuration),
      decoration: decoration
        ? frameAt(decoration, i * frameDuration)
        : undefined,
      duration: frameDuration,
    };
    const previous = samples.at(-1);
    if (
      previous?.avatar === next.avatar &&
      previous.decoration === next.decoration
    )
      previous.duration += frameDuration;
    else samples.push(next);
  }
  const first = base
    .clone()
    .composite(drawPatch(samples[0].avatar, samples[0].decoration), {
      x: left,
      y: top,
    });
  if (!animated)
    return {
      buffer: Buffer.from(await first.encodePNG({ compression: 1 })),
      extension: "png",
      notes,
    };
  const encoder = Animation.webpEncoder(base.width, base.height, {
    loopCount: Infinity,
    effort: 0,
    optimize: false,
  });
  await encoder.add(first, { duration: samples[0].duration });
  for (let i = 1; i < samples.length; i++) {
    const sample = samples[i];
    await encoder.add(drawPatch(sample.avatar, sample.decoration), {
      duration: sample.duration,
      xOffset: left,
      yOffset: top,
    });
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  const buffer = Buffer.from(await encoder.finish());
  if (buffer.length > maxBytes) {
    notes.push(
      "Animation exceeded the attachment limit; showing a still preview.",
    );
    return {
      buffer: Buffer.from(await first.encodePNG({ compression: 1 })),
      extension: "png",
      notes,
    };
  }
  if (duration > MAX_FRAMES * STEP_MS)
    notes.push("Animation preview limited to six seconds.");
  return { buffer, extension: "webp", notes };
}

async function renderProfile(
  baseCanvas: Canvas | Promise<Canvas>,
  assets: ProfileAssets,
  placement: Placement,
  maxBytes?: number,
): Promise<ProfileCard> {
  const notes: string[] = [];
  const load = async (url: string): Promise<Animation | null> => {
    try {
      const bytes = await download(url);
      try {
        return await decodeProfileAsset(bytes);
      } catch {
        notes.push("A large animation was reduced to its first frame.");
        return await Animation.decode(bytes, {
          onlyFirstFrame: true,
          maxPixels: MAX_PIXELS,
          threads: 1,
        });
      }
    } catch (error) {
      logger.warn(error, "Could not load profile asset");
      return null;
    }
  };
  const [loadedAvatar, decoration, canvas] = await Promise.all([
    load(assets.avatarUrl),
    assets.decorationUrl ? load(assets.decorationUrl) : null,
    baseCanvas,
  ]);
  let avatar = loadedAvatar;
  if (!avatar && assets.staticAvatarUrl) {
    const still = await loadImageCached(assets.staticAvatarUrl);
    const preview = createCanvas(256, 256);
    const previewContext = preview.getContext("2d");
    previewContext.imageSmoothingEnabled = false;
    previewContext.drawImage(still, 0, 0, 256, 256);
    avatar = new Animation([Frame.from(imageFromCanvas(preview))]);
    notes.push("Animated avatar unavailable; showing a still avatar.");
  }
  if (!avatar) throw new Error("Could not load the profile avatar");
  if (assets.decorationUrl && !decoration)
    notes.push("Avatar decoration unavailable.");
  const base = imageFromCanvas(canvas);
  const result = await compositeProfileCard(
    base,
    avatar,
    decoration,
    placement,
    maxBytes,
  );
  return { ...result, notes: [...notes, ...result.notes] };
}

export async function generateCamperCard(
  data: CardData,
  assets: ProfileAssets = { avatarUrl: data.avatarUrl },
  maxBytes?: number,
): Promise<ProfileCard> {
  return renderProfile(
    renderCamperCardCanvas(data),
    { ...assets, staticAvatarUrl: data.avatarUrl },
    scaledPlacement(profileAvatarPlacement()),
    maxBytes,
  );
}
export async function generateStatisticsCard(
  data: StatisticsCardData,
  assets: ProfileAssets = { avatarUrl: data.avatarUrl },
  maxBytes?: number,
): Promise<ProfileCard> {
  return renderProfile(
    renderStatisticsCardCanvas(data),
    { ...assets, staticAvatarUrl: data.avatarUrl },
    scaledPlacement(statisticsAvatarPlacement()),
    maxBytes,
  );
}

function scaledPlacement(placement: Placement): Placement {
  return {
    x: placement.x * PROFILE_SCALE,
    y: placement.y * PROFILE_SCALE,
    size: placement.size * PROFILE_SCALE,
  };
}

function imageFromCanvas(canvas: Canvas): Image {
  const image = new Image(canvas.width, canvas.height);
  image.bitmap = canvas
    .getContext("2d")
    .getImageData(0, 0, canvas.width, canvas.height).data;
  return image;
}
