import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "#src/types/index.js";
import { logger } from "#src/utils/logger.js";
import { generateCampsiteCard } from "#src/images/index.js";
import { errorEmbed } from "#src/embeds/index.js";
import { getCampsite } from "#src/game/services/campService.js";
import { getCampRow } from "#src/game/services/upgradeService.js";
import {
  buildCampsiteNoticePayload,
  campsitePayload,
} from "#src/discord/components/camp/buildCampComponents.js";
import { IS_COMPONENTS_V2 } from "#src/discord/constants.js";
import { findByDiscordId } from "#src/database/repositories/playerRepository.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("camp")
    .setDescription("View your campsite")
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

    await ctx.interaction.deferReply({ flags: IS_COMPONENTS_V2 });

    try {
      const isSelf = targetUser.id === ctx.interaction.user.id;
      const camp = isSelf ? await getCampRow(player.id) : null;
      const campsite = await getCampsite(player);
      const cardBuffer = await generateCampsiteCard(campsite);

      await ctx.interaction.editReply({
        ...campsitePayload(campsite.characterName, camp),
        files: [{ attachment: cardBuffer, name: "campsite_card.png" }],
      });
    } catch (error) {
      logger.error(error, "Failed to generate campsite card");
      await ctx.interaction.editReply(
        buildCampsiteNoticePayload(
          "The campsite got a little too sunny and the picture melted. Try again in a moment.",
        ),
      );
    }
  },
};

export default command;
