import { MessageFlags } from "discord.js";
import type { ModalHandler } from "../../../types/index.js";
import { TRADE_ITEM_MODAL } from "../../../discord/components/trade/buildTradeComponents.js";
import { errorEmbed, campfireEmbed } from "../../../embeds/index.js";
import { findByDiscordId } from "../../../database/repositories/playerRepository.js";
import { findById as findTradeById } from "../../../database/repositories/tradeRepository.js";
import {
  addItem,
  removeItem,
  TradeError,
} from "../../../game/services/tradeService.js";
import { refreshTradeMessage } from "../../buttons/trade/index.js";
import { logger } from "../../../utils/logger.js";

async function handleTradeItemModal(
  interaction: Parameters<ModalHandler>[0],
): Promise<void> {
  const [, action, kind, tradeId] = interaction.customId.split("|");
  if (action !== TRADE_ITEM_MODAL || !tradeId) return;

  const itemKey = interaction.fields.getStringSelectValues("trade_item")[0];
  if (!itemKey || (kind !== "add" && kind !== "remove")) {
    await interaction.reply({
      embeds: [errorEmbed("Choose an item before submitting the trade form.")],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const [player, trade] = await Promise.all([
    findByDiscordId(interaction.user.id),
    findTradeById(tradeId),
  ]);
  if (!trade) {
    await interaction.reply({
      embeds: [errorEmbed("That trade could not be found.")],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  if (
    !player ||
    (trade.sender_id !== player.id && trade.receiver_id !== player.id)
  ) {
    await interaction.reply({
      embeds: [errorEmbed("This isn't your trade.")],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    if (kind === "add") {
      await addItem(player.id, tradeId, itemKey);
    } else {
      await removeItem(player.id, tradeId, itemKey);
    }
    await refreshTradeMessage(interaction.client, trade);
    await interaction.editReply({
      embeds: [
        campfireEmbed()
          .setTitle(kind === "add" ? "Item Added" : "Item Removed")
          .setDescription("Your offer has been updated in the Trading Post."),
      ],
    });
  } catch (error) {
    if (error instanceof TradeError) {
      await interaction.editReply({ embeds: [errorEmbed(error.message)] });
      return;
    }
    logger.error(error, "Failed to update trade offer from modal");
    await interaction.editReply({
      embeds: [errorEmbed("The trade hit a snag. Try again in a moment.")],
    });
  }
}

export default new Map<string, ModalHandler>([["trade", handleTradeItemModal]]);
