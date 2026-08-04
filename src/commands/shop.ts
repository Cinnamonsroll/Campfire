import { SlashCommandBuilder } from "discord.js";
import type { Command } from "#src/types/index.js";
import { logger } from "#src/utils/logger.js";
import { IS_COMPONENTS_V2 } from "#src/discord/constants.js";
import { hasCharacter } from "#src/guards/index.js";
import { todayKey } from "#src/game/utils/date.js";
import { getShop, toShopCardData } from "#src/game/services/shop/index.js";
import { generateShopCard } from "#src/images/index.js";
import {
  buildShopNoticePayload,
  buildShopPayload,
} from "#src/discord/components/shop/buildShopComponents.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Browse the camp store's fresh daily supplies"),
  guards: [hasCharacter],
  async execute(ctx) {
    const player = ctx.player;
    if (!player) return;

    await ctx.interaction.deferReply({ flags: IS_COMPONENTS_V2 });

    try {
      const date = todayKey();
      const shop = await getShop(player, player.discord_id, date);
      const cardBuffer = await generateShopCard(toShopCardData(shop));

      await ctx.interaction.editReply({
        ...buildShopPayload(shop),
        files: [{ attachment: cardBuffer, name: "shop_card.png" }],
      });
    } catch (error) {
      logger.error(error, "Failed to render shop");
      await ctx.interaction.editReply(
        buildShopNoticePayload(
          "The store shutters flapped shut for a moment. Try again soon.",
        ),
      );
    }
  },
};

export default command;
