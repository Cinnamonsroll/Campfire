import { SlashCommandBuilder } from "discord.js";
import type { Command } from "#src/types/index.js";
import { hasCharacter, notInAdventure, energyAtLeast } from "#src/guards/index.js";
import { buildPlayReply } from "#src/discord/components/play/buildPlayComponents.js";
import { getUnlockedLocations } from "#src/game/services/locationService.js";
import { getLockedLocations } from "#src/game/services/unlockService.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Set out on a new adventure"),
  guards: [hasCharacter, notInAdventure, energyAtLeast(10)],
  async execute(ctx) {
    const player = ctx.player;
    if (!player) return;

    const unlocked = getUnlockedLocations(player.level);
    const locked = getLockedLocations(player.level);

    await ctx.interaction.reply(
      buildPlayReply(unlocked, locked, player.energy),
    );
  },
};

export default command;
