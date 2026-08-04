import type { StringSelectMenuHandler } from "#src/types/index.js";
import { assertMessageAuthor } from "#src/utils/interactionAuthor.js";
import { logger } from "#src/utils/logger.js";
import { FILTER_SELECT_CUSTOM_ID } from "#src/discord/components/journal/journalState.js";
import { parseJournalFilter } from "#src/game/services/journal/index.js";
import { updateJournal } from "#src/interactions/journal/update.js";

async function handleFilter(
  interaction: Parameters<StringSelectMenuHandler>[0],
): Promise<void> {
  if (!(await assertMessageAuthor(interaction))) return;

  const filter = parseJournalFilter(interaction.values[0] ?? "");
  if (!filter) return;

  try {
    await updateJournal(interaction, filter);
  } catch (error) {
    logger.error(error, "Failed to update journal from filter select");
  }
}

export default new Map<string, StringSelectMenuHandler>([
  [FILTER_SELECT_CUSTOM_ID, handleFilter],
]);
