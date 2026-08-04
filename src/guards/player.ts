import { findByDiscordId } from "../database/repositories/playerRepository.js";
import type { Player } from "../database/repositories/playerRepository.js";
import type { CommandContext, Guard } from "../guards/index.js";

async function resolvePlayer(ctx: CommandContext): Promise<Player | null> {
  const player = ctx.player ?? (await findByDiscordId(ctx.interaction.user.id));
  if (player) ctx.player = player;
  return player;
}

export const hasCharacter: Guard = async (ctx) => {
  if (!(await resolvePlayer(ctx))) {
    return {
      message: "No camper here yet. Use `/start` to begin your summer.",
    };
  }
  return true;
};

export const noCharacter: Guard = async (ctx) => {
  if (await resolvePlayer(ctx)) {
    return {
      message:
        "You're already at camp. Your summer story is still being written.",
    };
  }
  return true;
};
