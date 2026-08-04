import type { StringSelectMenuHandler } from "../types/index.js";
import { SHOP_SELECT_PREFIX } from "../discord/customIds.js";
import {
  buildShopNoticePayload,
  buildShopPayload,
} from "../discord/components/shop/buildShopComponents.js";
import { getShop } from "../game/services/shop/index.js";
import { findByDiscordId } from "../database/repositories/playerRepository.js";
import { assertMessageAuthor } from "../utils/interactionAuthor.js";
import { logger } from "../utils/logger.js";

async function handleShopSelect(
  interaction: Parameters<StringSelectMenuHandler>[0],
): Promise<void> {
  if (!(await assertMessageAuthor(interaction, "That store isn't yours."))) {
    return;
  }

  const [, date] = interaction.customId.split("|");
  const itemKey = interaction.values[0];
  if (!date || !itemKey) return;

  await interaction.deferUpdate();

  try {
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
    await interaction.editReply(buildShopPayload(shop, { itemKey }));
  } catch (error) {
    logger.error(error, "Failed to pick a shop item");
    await interaction.editReply(
      buildShopNoticePayload("The shelf wobbled. Try again in a moment."),
    );
  }
}

export default new Map<string, StringSelectMenuHandler>([
  [SHOP_SELECT_PREFIX, handleShopSelect],
]);
