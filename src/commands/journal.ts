import { SlashCommandBuilder } from "discord.js";
import type { Command } from "#/types/index.js";
import { hasCharacter } from "#/guards/index.js";
import { buildJournalReply } from "#/discord/components/journal/buildJournalView.js";
import { ALL_FILTER } from "#/game/services/journal/index.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("journal")
    .setDescription("Browse your field journal of discoveries"),
  guards: [hasCharacter],
  async execute(ctx) {
    const player = ctx.player;
    if (!player) return;

    await ctx.interaction.reply(await buildJournalReply(player, ALL_FILTER));
  },
};

export default command;
