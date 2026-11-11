import type { CommandContext } from "../guards/index.js";
import { findByDiscordId } from "../database/repositories/playerRepository.js";
import { findByPlayerId } from "../database/repositories/inventoryRepository.js";
import { findByIds } from "../database/repositories/itemRepository.js";
import { ITEMS } from "../game/data/items.js";
import { getTitle } from "../game/utils/titles.js";
import { xpToNextLevel } from "../game/utils/xp.js";
import { getStatistics } from "../game/services/statsService.js";
import { generateCamperCard, generateStatisticsCard } from "../images/index.js";
import { campfireEmbed, errorEmbed } from "../embeds/index.js";
import { logger } from "../utils/logger.js";
import { reportError } from "../utils/vanta.js";
import { resolveProfileAppearance } from "./profileAppearance.js";

export async function executeProfile(
  { interaction }: CommandContext,
  statistics = false,
): Promise<void> {
  await interaction.deferReply();
  try {
    const selected = interaction.options.getUser("user") ?? interaction.user;
    const player = await findByDiscordId(selected.id);
    if (!player) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            selected.id === interaction.user.id
              ? "You haven't started your adventure yet. Use `/start` to begin."
              : `${selected.username} hasn't started their adventure yet.`,
          ),
        ],
      });
      return;
    }
    const { user, assets, staticAvatarUrl, displayName } =
      await resolveProfileAppearance(interaction, selected);
    const characterName = player.character_name ?? "Unknown Camper";
    const maxBytes = Math.min(interaction.attachmentSizeLimit, 8 * 1024 * 1024);
    let result;
    if (statistics) {
      const values = await getStatistics(player);
      result = await generateStatisticsCard(
        {
          avatarUrl: staticAvatarUrl,
          characterName,
          accentColor: user.accentColor,
          statistics: values.map(({ definition, value }) => ({
            emoji: definition.emoji,
            label: definition.label,
            value,
            unit: definition.unit,
          })),
        },
        assets,
        maxBytes,
      );
    } else {
      const entries = (await findByPlayerId(player.id)).slice(0, 12);
      const items = await findByIds(entries.map((entry) => entry.item_id));
      const keys = new Map(items.map((item) => [item.id, item.item_key]));
      result = await generateCamperCard(
        {
          avatarUrl: staticAvatarUrl,
          characterName,
          title: getTitle(player.level),
          coins: player.coins,
          level: player.level,
          xp: player.xp,
          xpRequired: xpToNextLevel(player.level),
          accentColor: user.accentColor,
          inventory: entries.map((entry) => {
            const key = keys.get(entry.item_id);
            return {
              emoji: key ? ITEMS[key].emoji : "?",
              quantity: entry.quantity,
            };
          }),
        },
        assets,
        maxBytes,
      );
    }
    const filename = `${statistics ? "statistics" : "camper"}_card.${result.extension}`;
    await interaction.editReply({
      embeds: [
        campfireEmbed()
          .setAuthor({
            name: `${displayName} (@${user.username})`.slice(0, 256),
            iconURL: staticAvatarUrl,
          })
          .setTitle(
            `${characterName} · ${statistics ? "Statistics" : "Profile"}`,
          )
          .setImage(`attachment://${filename}`)
          .setFooter({
            text: ["Campfire", ...result.notes].join(" · ").slice(0, 2048),
          }),
      ],
      files: [{ attachment: result.buffer, name: filename }],
      allowedMentions: { parse: [] },
    });
  } catch (error) {
    logger.error(error, "Failed to render profile");
    reportError(error);
    await interaction.editReply({
      embeds: [
        errorEmbed("The camp records got tangled up. Try again in a moment."),
      ],
    });
  }
}
