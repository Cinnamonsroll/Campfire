import type { StringSelectMenuHandler } from "../../../types/index.js";
import { assertMessageAuthor } from "../../../utils/interactionAuthor.js";
import { logger } from "../../../utils/logger.js";
import { FILTER_SELECT_CUSTOM_ID } from "../../../discord/components/journal/journalState.js";
import { parseJournalFilter } from "../../../game/services/journal/index.js";
import { updateJournal } from "../../journal/update.js";

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
