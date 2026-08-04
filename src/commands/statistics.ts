import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "#src/types/index.js";
import { campfireEmbed, errorEmbed } from "#src/embeds/index.js";
import { findByDiscordId } from "#src/database/repositories/playerRepository.js";
import { generateStatisticsCard } from "#src/images/index.js";
import { getStatistics } from "#src/game/services/statsService.js";
import { logger } from "#src/utils/logger.js";

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
        avatarUrl: targetUser.displayAvatarURL({ size: 256 }),
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
