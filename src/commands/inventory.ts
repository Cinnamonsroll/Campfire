import { SlashCommandBuilder } from "discord.js";
import { buildInventoryReply } from "../discord/components/inventory/buildInventoryView.js";
import { ALL_FILTER } from "../game/services/inventory/index.js";
import { hasCharacter } from "../guards/index.js";
import type { Command } from "../types/index.js";

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
