import { SlashCommandBuilder } from "discord.js";
import { buildInventoryReply } from "#src/discord/components/inventory/buildInventoryView.js";
import { ALL_FILTER } from "#src/game/services/inventory/index.js";
import { hasCharacter } from "#src/guards/index.js";
import type { Command } from "#src/types/index.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Browse everything you've collected in your backpack"),
  guards: [hasCharacter],
  async execute(ctx) {
    const player = ctx.player;
    if (!player) return;

    await ctx.interaction.reply(await buildInventoryReply(player, ALL_FILTER));
  },
};

export default command;
