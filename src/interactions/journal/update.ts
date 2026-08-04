import type { MessageComponentInteraction } from "discord.js";
import { findByDiscordId } from "../database/repositories/playerRepository.js";
import { buildJournalReply } from "../discord/components/journal/buildJournalView.js";
import { buildNoticePayload } from "../discord/components/journal/buildJournalComponents.js";
import type { JournalFilter } from "../game/services/journal/index.js";

const NO_CAMPER_MESSAGE =
  "No camper here yet. Use `/start` to begin your summer.";

export async function updateJournal(
  interaction: MessageComponentInteraction,
  filter: JournalFilter,
): Promise<void> {
  const player = await findByDiscordId(interaction.user.id);
  if (!player) {
    await interaction.update(buildNoticePayload(NO_CAMPER_MESSAGE));
    return;
  }

  const payload = await buildJournalReply(player, filter);
  await interaction.update(payload);
}
