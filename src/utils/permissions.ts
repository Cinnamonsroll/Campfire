import { ChatInputCommandInteraction } from "discord.js";
import { PermissionCheck } from "../types/index.js";

export async function checkPermissions(
  interaction: ChatInputCommandInteraction,
  checks: PermissionCheck[],
): Promise<string | null> {
  for (const check of checks) {
    const passed = await check.check(interaction);
    if (!passed) return check.error;
  }
  return null;
}
