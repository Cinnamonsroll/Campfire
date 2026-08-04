import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { welcomeIntro } from "#/embeds/index.js";
import type { Command } from "#/types/index.js";
import { noCharacter } from "#/guards/player.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Begin your summer at Camp Solstice"),
  guards: [noCharacter],
  async execute(ctx) {
    await ctx.interaction.reply({
      embeds: [welcomeIntro()],
      components: [
        new ActionRowBuilder<ButtonBuilder>({
          components: [
            new ButtonBuilder({
              customId: "start_continue",
              label: "Continue",
              style: ButtonStyle.Primary,
              emoji: { name: "🏕" },
            }),
          ],
        }),
      ],
    });
  },
};

export default command;
