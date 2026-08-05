import { redis } from "../../redis/client.js";
import { RedisKeys } from "../../redis/keys.js";

type GameSessionKey = (discordId: string) => string;

const SESSION_KEYS: readonly GameSessionKey[] = [
  RedisKeys.gameFish,
  RedisKeys.gameCatch,
  RedisKeys.gamePhoto,
];

const SESSION_TTL_SECONDS = 600;

export async function anyActivityInProgress(discordId: string): Promise<boolean> {
  const keys = SESSION_KEYS.map((makeKey) => makeKey(discordId));
  const found = await redis.mGet(keys);
  return found.some((value) => value !== null);
}

export async function startSession(
  key: string,
  state: unknown,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<boolean> {
  const claimed = await redis.set(key, JSON.stringify(state), {
    NX: true,
    EX: ttlSeconds,
  });
  return claimed === "OK";
}

export async function getSession<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function updateSession(
  key: string,
  state: unknown,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<void> {
  await redis.set(key, JSON.stringify(state), { EX: ttlSeconds });
}

export async function clearSession(key: string): Promise<void> {
  await redis.del(key);
}
