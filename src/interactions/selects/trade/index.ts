import { MessageFlags } from "discord.js";
import type { StringSelectMenuHandler } from "../../../types/index.js";
import {
  TRADE_ADD_ITEM,
  TRADE_REMOVE_ITEM,
} from "../../../discord/components/trade/buildTradeComponents.js";
import { campfireEmbed, errorEmbed } from "../../../embeds/index.js";
import { findById as findTradeById } from "../../../database/repositories/tradeRepository.js";
import { findByDiscordId } from "../../../database/repositories/playerRepository.js";
import {
  addItem,
  removeItem,
  TradeError,
} from "../../../game/services/tradeService.js";
import { refreshTradeMessage } from "../../buttons/trade/index.js";
import { logger } from "../../../utils/logger.js";

async function handleTradeSelect(
  interaction: Parameters<StringSelectMenuHandler>[0],
): Promise<void> {
  const [, action, tradeId] = interaction.customId.split("|");
  const itemKey = interaction.values[0];
  if (!itemKey || !tradeId) return;

  const trade = await findTradeById(tradeId);
  if (!trade) {
    await interaction.reply({
      embeds: [errorEmbed("That trade could not be found.")],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const player = await findByDiscordId(interaction.user.id);
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

  await interaction.deferUpdate();

  try {
    if (action === TRADE_ADD_ITEM) {
      await addItem(player.id, tradeId, itemKey);
    } else if (action === TRADE_REMOVE_ITEM) {
      await removeItem(player.id, tradeId, itemKey);
    } else {
      return;
    }

    await refreshTradeMessage(interaction.client, trade);
    await interaction.editReply({
      embeds: [
        campfireEmbed()
          .setTitle("Offer Updated")
          .setDescription(
            action === TRADE_ADD_ITEM
              ? "Item added to your offer. Check the Trading Post."
              : "Item removed from your offer. Check the Trading Post.",
          ),
      ],
      components: [],
    });
  } catch (error) {
    if (error instanceof TradeError) {
      await interaction.editReply({
        embeds: [errorEmbed(error.message)],
      });
      return;
    }
    logger.error(error, "Failed to handle trade select");
    await interaction.editReply({
      embeds: [errorEmbed("The trade hit a snag. Try again in a moment.")],
    });
  }
}

export default new Map<string, StringSelectMenuHandler>([
  ["trade", handleTradeSelect],
]);
