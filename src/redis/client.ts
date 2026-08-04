import { createClient } from "redis";
import { env } from "../config/index.js";
import { logger } from "../utils/logger.js";

export const redis = createClient({ url: env.REDIS_URL });

redis.on("error", (err) => {
  logger.error(err, "Redis client error");
});

redis.on("connect", () => {
  logger.info("Connected to Redis");
});

export async function connectRedis(): Promise<void> {
  await redis.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}
