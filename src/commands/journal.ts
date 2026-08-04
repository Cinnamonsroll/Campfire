import { SlashCommandBuilder } from "discord.js";
import type { Command } from "#src/types/index.js";
import { hasCharacter } from "#src/guards/index.js";
import { buildJournalReply } from "#src/discord/components/journal/buildJournalView.js";
import { ALL_FILTER } from "#src/game/services/journal/index.js";

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
