import type { ModalHandler } from "#src/types/index.js";
import { MessageFlags } from "discord.js";
import { logger } from "#src/utils/logger.js";
import { errorEmbed, campfireEmbed, welcomeCeremony } from "#src/embeds/index.js";
import { generateCamperCard } from "#src/images/index.js";
import {
  findByDiscordId,
  create,
} from "#src/database/repositories/playerRepository.js";
import { ensureItemsByKeys } from "#src/database/repositories/itemRepository.js";
import { addItems } from "#src/database/repositories/inventoryRepository.js";
import { ITEMS } from "#src/game/data/items.js";
import { STARTING_ITEM_KEYS } from "#src/game/data/startingItems.js";
import { getTitle } from "#src/game/utils/titles.js";
import { xpToNextLevel } from "#src/game/utils/xp.js";

async function handleNameSubmit(
  interaction: Parameters<ModalHandler>[0],
): Promise<void> {
  const name = interaction.fields.getTextInputValue("camper_name").trim();

  const existing = await findByDiscordId(interaction.user.id);
  if (existing) {
    await interaction.reply({
      embeds: [
        campfireEmbed()
          .setTitle("You're already a camper!")
          .setDescription(
            `You left camp as ${existing.character_name ?? "camper"}, but the fire's still burning. Come back anytime!`,
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await interaction.deferReply();
  } catch (error) {
    logger.error(error, "Failed to defer start modal reply");
    return;
  }

  try {
    const player = await create(interaction.user.id, name);
    const dbItems = await ensureItemsByKeys([...STARTING_ITEM_KEYS]);
    if (dbItems.length > 0) {
      await addItems(
        player.id,
        dbItems.map((item) => ({ itemId: item.id, quantity: 1 })),
      );
    }

    const avatarUrl = interaction.user.displayAvatarURL({
      extension: "png",
      size: 1024,
      forceStatic: true,
    });

    const startingItems = STARTING_ITEM_KEYS.map((k) => ITEMS[k]);

    const cardBuffer = await generateCamperCard({
      avatarUrl,
      characterName: name,
      title: getTitle(player.level),
      coins: player.coins,
      level: player.level,
      xp: 0,
      xpRequired: xpToNextLevel(player.level),
      inventory: startingItems.map((item) => ({
        emoji: item.emoji,
        quantity: 1,
      })),
      accentColor: interaction.user.accentColor ?? null,
    });
    const file = { attachment: cardBuffer, name: "camper_card.webp" };

    const embed = welcomeCeremony(name, startingItems).setImage(
      "attachment://camper_card.webp",
    );

    await interaction.editReply({ embeds: [embed], files: [file] });

    if (interaction.message) {
      await interaction.message.delete().catch(() => undefined);
    }
  } catch (error) {
    logger.error(error, "Failed to create player from start modal");
    try {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            "Something went wrong pitching your tent. Give it another try.",
          ),
        ],
      });
    } catch (innerError) {
      logger.error(
        innerError,
        "Failed to send error reply after start modal failure",
      );
    }
  }
}

export default new Map<string, ModalHandler>([
  ["start_name_modal", handleNameSubmit],
]);
