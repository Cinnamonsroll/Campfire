import { SlashCommandBuilder } from "discord.js";
import type { Command } from "#src/types/index.js";
import { hasCharacter } from "#src/guards/index.js";
import { buildHelpPayload } from "#src/discord/components/help/buildHelpComponents.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("See the Campfire guide"),
  guards: [hasCharacter],
  async execute(ctx) {
    await ctx.interaction.reply(buildHelpPayload(0));
  },
};

export default command;
