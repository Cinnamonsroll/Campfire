import { redis } from "#/redis/client.js";
import { RedisKeys } from "#/redis/keys.js";
import type { Guard } from "#/guards/index.js";

export const notInAdventure: Guard = async (ctx) => {
  const exists = await redis.exists(
    RedisKeys.adventure(ctx.interaction.user.id),
  );
  if (exists)
    return {
      message: "You're already out on the trails. Come back when you're done.",
    };
  return true;
};
