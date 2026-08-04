import { MessageFlags } from "discord.js";
import type { ButtonHandler } from "../../../types/index.js";
import { SHOP_BUY_PREFIX, SHOP_CANCEL_PREFIX } from "../../../discord/customIds.js";
import {
  buildShopNoticePayload,
  buildShopPayload,
} from "../../../discord/components/shop/buildShopComponents.js";
import {
  getShop,
  purchaseItem,
  ShopError,
} from "../../../game/services/shop/index.js";
import { findByDiscordId } from "../../../database/repositories/playerRepository.js";
import { errorEmbed } from "../../../embeds/index.js";
import { assertMessageAuthor } from "../../../utils/interactionAuthor.js";
import { logger } from "../../../utils/logger.js";

async function refreshShop(
  interaction: Parameters<ButtonHandler>[0],
  date: string,
  notice?: string | null,
): Promise<void> {
  const player = await findByDiscordId(interaction.user.id);
  if (!player) {
    await interaction.editReply(
      buildShopNoticePayload(
        "No camper here yet. Use `/start` to begin your summer.",
      ),
    );
    return;
  }
  const shop = await getShop(player, player.discord_id, date);
  await interaction.editReply(buildShopPayload(shop, null, notice));
}

async function handleShopBuy(
  interaction: Parameters<ButtonHandler>[0],
  date: string,
  itemKey: string,
): Promise<void> {
  const player = await findByDiscordId(interaction.user.id);
  if (!player) {
    await interaction.editReply(
      buildShopNoticePayload(
        "No camper here yet. Use `/start` to begin your summer.",
      ),
    );
    return;
  }

  try {
    const result = await purchaseItem(player, player.discord_id, date, itemKey);
    const notice = result.energyRestored
      ? `You bought ${result.item.entry.emoji} ${result.item.entry.name} for ${String(result.coinsSpent)} coins, and your energy is topped up.`
      : `You bought ${result.item.entry.emoji} ${result.item.entry.name} for ${String(result.coinsSpent)} coins.`;

    const shop = await getShop(result.player, player.discord_id, date);
    await interaction.editReply(buildShopPayload(shop, null, notice));
  } catch (error) {
    if (error instanceof ShopError) {
      await refreshShop(interaction, date);
      await interaction.followUp({
        embeds: [errorEmbed(error.message)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    logger.error(error, "Failed to buy shop item");
    await refreshShop(interaction, date);
    await interaction.followUp({
      embeds: [errorEmbed("The register jammed. Try again in a moment.")],
      flags: MessageFlags.Ephemeral,
    });
  }
}

async function handleShopButton(
  interaction: Parameters<ButtonHandler>[0],
): Promise<void> {
  if (!(await assertMessageAuthor(interaction, "That store isn't yours."))) {
    return;
  }

  const [prefix, date, itemKey] = interaction.customId.split("|");
  if (!date) return;

  await interaction.deferUpdate();

  try {
    if (prefix === SHOP_BUY_PREFIX) {
      if (!itemKey) return;
      await handleShopBuy(interaction, date, itemKey);
      return;
    }

    if (prefix === SHOP_CANCEL_PREFIX) {
      await refreshShop(interaction, date);
    }
  } catch (error) {
    logger.error(error, "Failed to handle shop button");
    await interaction.editReply(
      buildShopNoticePayload(
        "The storefront flickered. Try again in a moment.",
      ),
    );
  }
}

export default new Map<string, ButtonHandler>([
  [SHOP_BUY_PREFIX, handleShopButton],
  [SHOP_CANCEL_PREFIX, handleShopButton],
]);
