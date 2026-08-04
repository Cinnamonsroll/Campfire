import type { ChatInputCommandInteraction } from "discord.js";
import type { Player } from "#/database/repositories/playerRepository.js";

export { hasCharacter, noCharacter } from "./player.js";
export { notInAdventure } from "./adventure.js";
export { energyAtLeast } from "./energy.js";

export type GuardResult = true | { message: string };

export interface CommandContext {
  interaction: ChatInputCommandInteraction;
  player?: Player;
}

export type Guard = (ctx: CommandContext) => GuardResult | Promise<GuardResult>;

export async function runGuards(
  ctx: CommandContext,
  guards: Guard[],
): Promise<string | null> {
  for (const guard of guards) {
    const result = await guard(ctx);
    if (result !== true) return result.message;
  }
  return null;
}
