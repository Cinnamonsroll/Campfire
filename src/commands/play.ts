import { SlashCommandBuilder } from "discord.js";
import type { Command } from "#/types/index.js";
import { hasCharacter, notInAdventure, energyAtLeast } from "#/guards/index.js";
import { buildPlayReply } from "#/discord/components/play/buildPlayComponents.js";
import { getUnlockedLocations } from "#/game/services/locationService.js";
import { getLockedLocations } from "#/game/services/unlockService.js";

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
