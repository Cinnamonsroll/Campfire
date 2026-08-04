import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { DAILY_CLAIM_PREFIX } from "#/discord/customIds.js";
import type { DailyQuestRow } from "#/database/repositories/questRepository.js";

export function buildClaimRow(
  quests: DailyQuestRow[],
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>({
    components: quests.map((quest) => {
      const button = new ButtonBuilder()
        .setCustomId(`${DAILY_CLAIM_PREFIX}|${quest.id}`)
        .setLabel(`Claim ${quest.title ?? quest.quest_key}`)
        .setStyle(ButtonStyle.Success);
      if (quest.emoji) {
        button.setEmoji(quest.emoji);
      }
      return button;
    }),
  });
}
