import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "#src/types/index.js";
import { hasCharacter } from "#src/guards/index.js";
import { tradeEmbed } from "#src/embeds/index.js";
import { errorEmbed } from "#src/embeds/index.js";
import { buildTradeActionRows } from "#src/discord/components/trade/buildTradeComponents.js";
import { findByDiscordId } from "#src/database/repositories/playerRepository.js";
import { setMessageRef } from "#src/database/repositories/tradeRepository.js";
import { createTrade, TradeError } from "#src/game/services/tradeService.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("trade")
    .setDescription("Offer a trade to another camper")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The camper you'd like to trade with")
        .setRequired(true),
    ) as SlashCommandBuilder,
  guards: [hasCharacter],
  async execute(ctx) {
    const player = ctx.player;
    if (!player) return;

    const targetUser = ctx.interaction.options.getUser("user");
    if (!targetUser) {
      await ctx.interaction.reply({
        embeds: [errorEmbed("Pick someone to trade with.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (targetUser.id === player.discord_id) {
      await ctx.interaction.reply({
        embeds: [errorEmbed("You can't trade with yourself.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const targetPlayer = await findByDiscordId(targetUser.id);
    if (!targetPlayer) {
      await ctx.interaction.reply({
        embeds: [
          errorEmbed(
            `${targetUser.username} hasn't started their adventure yet.`,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const state = await createTrade(player.id, targetPlayer.id);
      await ctx.interaction.reply({
        content: `<@${targetUser.id}>, you've received a trade request.`,
        embeds: [tradeEmbed(state)],
        components: buildTradeActionRows(state),
      });

      const message = await ctx.interaction.fetchReply();
      await setMessageRef(state.trade.id, message.id, message.channelId);
    } catch (error) {
      if (error instanceof TradeError) {
        await ctx.interaction.reply({
          embeds: [errorEmbed(error.message)],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      throw error;
    }
  },
};

export default command;
