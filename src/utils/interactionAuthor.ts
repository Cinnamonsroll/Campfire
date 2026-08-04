import {
  MessageFlags,
  type ButtonInteraction,
  type StringSelectMenuInteraction,
} from "discord.js";
import { errorEmbed } from "../embeds/index.js";
import { logger } from "../utils/logger.js";

export async function assertMessageAuthor(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  message = "This isn't your campfire to tend.",
): Promise<boolean> {
  const authorId = interaction.message.interactionMetadata?.user.id;
  if (authorId && authorId !== interaction.user.id) {
    try {
      await interaction.reply({
        embeds: [errorEmbed(message)],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      logger.error(error, "Failed to reply to non-author message interaction");
    }
    return false;
  }
  return true;
}
