import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { IS_COMPONENTS_V2 } from "../discord/constants.js";
import { hasCharacter } from "../guards/index.js";
import { todayKey } from "../game/utils/date.js";
import { getShop, toShopCardData } from "../game/services/shop/index.js";
import { generateShopCard } from "../images/index.js";
import {
  buildShopNoticePayload,
  buildShopPayload,
} from "../discord/components/shop/buildShopComponents.js";

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
