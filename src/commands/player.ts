import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { findByDiscordId } from "../database/repositories/playerRepository.js";
import { findByPlayerId } from "../database/repositories/inventoryRepository.js";
import { findByIds } from "../database/repositories/itemRepository.js";
import { ITEMS } from "../game/data/items.js";
import { generateCamperCard } from "../images/index.js";
import { campfireEmbed, errorEmbed } from "../embeds/index.js";
import { getTitle } from "../game/utils/titles.js";
import { xpToNextLevel } from "../game/utils/xp.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("player")
    .setDescription("View a camper's profile card")
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

    await ctx.interaction.deferReply();

    try {
      const avatarUrl = targetUser.displayAvatarURL({
        extension: "png",
        size: 1024,
        forceStatic: true,
      });

      const inventoryEntries = (await findByPlayerId(player.id)).slice(0, 12);
      const itemIds = inventoryEntries.map((e) => e.item_id);
      const dbItems = await findByIds(itemIds);

      const itemKeyMap = new Map(dbItems.map((i) => [i.id, i.item_key]));

      const inventorySlots = inventoryEntries.map((entry) => {
        const itemKey = itemKeyMap.get(entry.item_id);
        const itemDef = itemKey ? ITEMS[itemKey] : undefined;
        return {
          emoji: itemDef?.emoji ?? "❓",
          quantity: entry.quantity,
        };
      });

      const xpRequired = xpToNextLevel(player.level);

      const cardBuffer = await generateCamperCard({
        avatarUrl,
        characterName: player.character_name ?? "Unknown Camper",
        title: getTitle(player.level),
        coins: player.coins,
        level: player.level,
        xp: player.xp,
        xpRequired,
        inventory: inventorySlots,
        accentColor: targetUser.accentColor ?? null,
      });

      const file = { attachment: cardBuffer, name: "camper_card.png" };

      await ctx.interaction.editReply({
        embeds: [
          campfireEmbed()
            .setTitle(`🏕 ${player.character_name ?? targetUser.username}`)
            .setImage("attachment://camper_card.png"),
        ],
        files: [file],
      });
    } catch (error) {
      logger.error(error, "Failed to generate player card");
      await ctx.interaction.editReply({
        embeds: [
          errorEmbed("The camp records got tangled up. Try again in a moment."),
        ],
      });
    }
  },
};

export default command;
