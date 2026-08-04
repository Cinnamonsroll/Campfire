import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  CLIENT_ID: z.string().min(1),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  OWNER_IDS: z.string().default(""),
});

function parseOwnerIds(raw: string): string[] {
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

export const env = envSchema.parse(process.env);

export const ownerIds: ReadonlySet<string> = new Set(
  parseOwnerIds(env.OWNER_IDS),
);

export type Env = z.infer<typeof envSchema>;
