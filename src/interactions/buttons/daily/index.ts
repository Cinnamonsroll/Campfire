import type { ButtonHandler } from "../types/index.js";
import { MessageFlags } from "discord.js";
import { DAILY_CLAIM_PREFIX } from "../discord/customIds.js";
import { buildClaimRow } from "../discord/components/daily/buildDailyComponents.js";
import {
  dailyClaimedEmbed,
  dailyQuestsEmbed,
  errorEmbed,
} from "../embeds/index.js";
import { findByDiscordId } from "../database/repositories/playerRepository.js";
import {
  findById,
  findDailyByPlayerId,
  type DailyQuestRow,
} from "../database/repositories/questRepository.js";
import {
  claimDailyQuest,
  getDailyQuests,
} from "../game/services/dailyQuestService.js";
import { todayKey } from "../game/utils/date.js";
import { assertMessageAuthor } from "../utils/interactionAuthor.js";
import { logger } from "../utils/logger.js";

async function resolveClaimableQuest(
  playerId: string,
  questId: string | undefined,
): Promise<DailyQuestRow | null> {
  if (!questId) return null;

  const quest = await findById(questId);
  if (!quest || !quest.completed || quest.claimed) return null;

  const todays = await findDailyByPlayerId(playerId, todayKey());
  return todays.find((row) => row.id === questId) ?? null;
}

async function handleClaim(
  interaction: Parameters<ButtonHandler>[0],
): Promise<void> {
  if (
    !(await assertMessageAuthor(
      interaction,
      "Those quests aren't yours to claim.",
    ))
  ) {
    return;
  }

  await interaction.deferUpdate();

  const questId = interaction.customId.split("|")[1];
  const player = await findByDiscordId(interaction.user.id);
  const claimable = player
    ? await resolveClaimableQuest(player.id, questId)
    : null;

  if (!player || !claimable) {
    await interaction.followUp({
      embeds: [errorEmbed("That quest isn't ready to claim just yet.")],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    const { summary } = await claimDailyQuest(player, claimable);

    const quests = await getDailyQuests(player.id, player.discord_id);
    const open = quests.filter((quest) => quest.completed && !quest.claimed);

    await interaction.editReply({
      embeds: [dailyQuestsEmbed(quests)],
      components: open.length > 0 ? [buildClaimRow(open)] : [],
    });
    await interaction.followUp({
      embeds: [dailyClaimedEmbed(claimable, summary)],
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    logger.error(error, "Failed to claim daily quest");
    await interaction.followUp({
      embeds: [errorEmbed("The reward slipped away. Try again in a moment.")],
      flags: MessageFlags.Ephemeral,
    });
  }
}

export default new Map<string, ButtonHandler>([
  [DAILY_CLAIM_PREFIX, handleClaim],
]);
