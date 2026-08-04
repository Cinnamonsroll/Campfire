import {
  MessageFlags,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type Client,
} from "discord.js";
import type { ButtonHandler } from "#src/types/index.js";
import {
  TRADE_ACCEPT,
  TRADE_ADD,
  TRADE_COINS,
  TRADE_DECLINE,
  TRADE_REMOVE,
  tradeItemModalId,
} from "#src/discord/components/trade/buildTradeComponents.js";
import {
  campfireEmbed,
  errorEmbed,
  tradeCompleteEmbed,
  tradeEmbed,
} from "#src/embeds/index.js";
import { buildTradeActionRows } from "#src/discord/components/trade/buildTradeComponents.js";
import {
  findById as findTradeById,
  type Trade,
} from "#src/database/repositories/tradeRepository.js";
import {
  findByDiscordId,
  findById as findPlayerById,
} from "#src/database/repositories/playerRepository.js";
import { getItemDefinition } from "#src/game/data/items.js";
import { isStartingItem } from "#src/game/data/startingItems.js";
import { getInventoryView } from "#src/game/services/inventory/index.js";
import {
  acceptTrade,
  acceptTradeInvitation,
  addCoins,
  declineTrade,
  getTradeState,
  TradeError,
} from "#src/game/services/tradeService.js";
import { logger } from "#src/utils/logger.js";

async function getParticipantId(
  interaction: Parameters<ButtonHandler>[0],
  trade: Trade,
): Promise<string | null> {
  const player = await findByDiscordId(interaction.user.id);
  if (
    player &&
    (trade.sender_id === player.id || trade.receiver_id === player.id)
  ) {
    return player.id;
  }

  await interaction.reply({
    embeds: [errorEmbed("This isn't your trade.")],
    flags: MessageFlags.Ephemeral,
  });
  return null;
}

function declineEmbed(): ReturnType<typeof campfireEmbed> {
  return campfireEmbed()
    .setTitle("Trade Declined")
    .setDescription("The trade was turned down. Better luck next time.");
}

async function showItemPicker(
  interaction: Parameters<ButtonHandler>[0],
  tradeId: string,
  kind: "add" | "remove",
): Promise<void> {
  const trade = await findTradeById(tradeId);
  if (!trade) {
    await interaction.reply({
      embeds: [errorEmbed("That trade could not be found.")],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const participantId = await getParticipantId(interaction, trade);
  if (!participantId) return;
  if (trade.status !== "accepted") {
    await interaction.reply({
      embeds: [errorEmbed("Wait for the invited camper to accept first.")],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const state = await getTradeState(tradeId);
  const side =
    participantId === state.sender.player.id ? state.sender : state.receiver;
  const options: StringSelectMenuOptionBuilder[] = [];

  if (kind === "add") {
    const view = await getInventoryView(
      participantId,
      interaction.user.username,
    );
    for (const category of view.categories) {
      for (const item of category.items) {
        if (options.length >= 25) break;
        if (isStartingItem(item.itemKey)) continue;
        const remaining = item.quantity - (side.offer.items[item.itemKey] ?? 0);
        if (remaining <= 0) continue;
        options.push(
          new StringSelectMenuOptionBuilder()
            .setLabel(`${item.name} (${String(remaining)} left)`)
            .setValue(item.itemKey)
            .setEmoji(item.emoji),
        );
      }
      if (options.length >= 25) break;
    }
  } else {
    for (const [itemKey, quantity] of Object.entries(side.offer.items)) {
      if (options.length >= 25) break;
      const item = getItemDefinition(itemKey);
      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(`${item?.name ?? itemKey} (${String(quantity)})`)
          .setValue(itemKey)
          .setEmoji(item?.emoji ?? "?"),
      );
    }
  }

  if (options.length === 0) {
    await interaction.reply({
      embeds: [
        errorEmbed(
          kind === "add"
            ? "You don't have anything left to offer."
            : "Your offer is empty.",
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const itemSelect = new StringSelectMenuBuilder()
    .setCustomId("trade_item")
    .setPlaceholder("Choose an item")
    .addOptions(options);
  const modal = new ModalBuilder()
    .setCustomId(tradeItemModalId(tradeId, kind))
    .setTitle(kind === "add" ? "Add items to your offer" : "Remove an item")
    .addLabelComponents({
      type: 18,
      label:
        kind === "add" ? "Choose an item to offer" : "Choose an item to remove",
      component: itemSelect.toJSON(),
    });

  await interaction.showModal(modal);
}

async function updateTradeMessage(
  interaction: Parameters<ButtonHandler>[0],
  tradeId: string,
): Promise<void> {
  const state = await getTradeState(tradeId);
  await interaction.editReply({
    embeds: [tradeEmbed(state)],
    components: buildTradeActionRows(state),
  });
}

async function handleTradeButton(
  interaction: Parameters<ButtonHandler>[0],
): Promise<void> {
  const [, action, argA, argB] = interaction.customId.split("|");

  try {
    if (action === TRADE_ADD || action === TRADE_REMOVE) {
      await showItemPicker(
        interaction,
        argA,
        action === TRADE_ADD ? "add" : "remove",
      );
      return;
    }

    const tradeId = action === TRADE_COINS ? argB : argA;
    const trade = await findTradeById(tradeId);
    if (!trade) {
      await interaction.reply({
        embeds: [errorEmbed("That trade could not be found.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const participantId = await getParticipantId(interaction, trade);
    if (!participantId) return;
    if (
      trade.status === "pending" &&
      (action === TRADE_ACCEPT || action === TRADE_DECLINE) &&
      participantId !== trade.receiver_id
    ) {
      await interaction.reply({
        embeds: [
          errorEmbed(
            "Only the invited camper can respond to this trade request.",
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferUpdate();

    if (action === TRADE_ACCEPT) {
      if (trade.status === "pending") {
        const state = await acceptTradeInvitation(participantId, tradeId);
        await interaction.editReply({
          embeds: [tradeEmbed(state)],
          components: buildTradeActionRows(state),
        });
        return;
      }

      const result = await acceptTrade(participantId, tradeId);
      if (result.executed && result.summary) {
        const [sender, receiver] = await Promise.all([
          findPlayerById(result.trade.sender_id),
          findPlayerById(result.trade.receiver_id),
        ]);
        await interaction.editReply({
          embeds: [
            tradeCompleteEmbed(
              result.summary,
              sender?.character_name ?? "Sender",
              receiver?.character_name ?? "Receiver",
            ),
          ],
          components: [],
        });
      } else {
        await updateTradeMessage(interaction, tradeId);
      }
      return;
    }

    if (action === TRADE_DECLINE) {
      await declineTrade(participantId, tradeId);
      await interaction.editReply({ embeds: [declineEmbed()], components: [] });
      return;
    }

    if (action === TRADE_COINS) {
      const state = await addCoins(participantId, tradeId, Number(argA));
      await interaction.editReply({
        embeds: [tradeEmbed(state)],
        components: buildTradeActionRows(state),
      });
    }
  } catch (error) {
    if (error instanceof TradeError) {
      const payload = {
        embeds: [errorEmbed(error.message)],
        flags: MessageFlags.Ephemeral,
      } as const;
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
      return;
    }
    logger.error(error, "Failed to handle trade button");
    const payload = {
      embeds: [errorEmbed("The trade hit a snag. Try again in a moment.")],
      flags: MessageFlags.Ephemeral,
    } as const;
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
}

export async function refreshTradeMessage(
  client: Client,
  trade: Trade,
): Promise<void> {
  if (!trade.message_id || !trade.channel_id) return;

  const channel = await client.channels.fetch(trade.channel_id);
  if (!channel?.isTextBased()) return;

  const message = await channel.messages
    .fetch(trade.message_id)
    .catch(() => null);
  if (!message) return;

  const state = await getTradeState(trade.id);
  if (state.trade.status !== "pending" && state.trade.status !== "accepted") {
    return;
  }

  await message.edit({
    embeds: [tradeEmbed(state)],
    components: buildTradeActionRows(state),
  });
}

export default new Map<string, ButtonHandler>([["trade", handleTradeButton]]);
