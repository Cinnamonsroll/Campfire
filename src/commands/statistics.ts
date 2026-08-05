import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { findByDiscordId } from "../database/repositories/playerRepository.js";
import { errorEmbed, campfireEmbed } from "../embeds/index.js";
import { getStatistics } from "../game/services/statsService.js";
import { generateStatisticsCard } from "../images/index.js";
import { Command } from "../types/index.js";
import { logger } from "../utils/loaders/index.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("statistics")
    .setDescription("Review a camper's lifetime stats")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The camper to look up (defaults to yourself)")
        .setRequired(false),
    ) as SlashCommandBuilder,
  async execute(ctx) {
    const targetUser =
      ctx.interaction.options.getUser("user") ?? ctx.interaction.user;
    const player = await findByDiscordId(targetUser.id);
    if (!player) {
      await ctx.interaction.reply({
        embeds: [
          errorEmbed(
            targetUser.id === ctx.interaction.user.id
              ? "You haven't started your adventure yet. Use `/start` to begin."
              : `${targetUser.username} hasn't started their adventure yet.`,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await ctx.interaction.deferReply();

    try {
      const values = await getStatistics(player);
      const cardBuffer = await generateStatisticsCard({
        avatarUrl: targetUser.displayAvatarURL({
          extension: "png",
          size: 512,
          forceStatic: true,
        }),
        characterName: player.character_name ?? targetUser.username,
        accentColor: targetUser.accentColor,
        statistics: values.map(({ definition, value }) => ({
          emoji: definition.emoji,
          label: definition.label,
          value,
          unit: definition.unit,
        })),
      });

      await ctx.interaction.editReply({
        embeds: [
          campfireEmbed()
            .setTitle(`🏕 ${player.character_name ?? targetUser.username}`)
            .setImage("attachment://statistics_card.png"),
        ],
        files: [{ attachment: cardBuffer, name: "statistics_card.png" }],
      });
    } catch (error) {
      logger.error(error, "Failed to render statistics card");
      await ctx.interaction.editReply({
        embeds: [
          errorEmbed(
            "The camp ledger got caught in the rain. Try viewing these statistics again in a moment.",
          ),
        ],
      });
    }
  },
};

export default command;
