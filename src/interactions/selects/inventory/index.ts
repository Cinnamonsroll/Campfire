import type { StringSelectMenuHandler } from "#src/types/index.js";
import { assertMessageAuthor } from "#src/utils/interactionAuthor.js";
import { logger } from "#src/utils/logger.js";
import { FILTER_SELECT_CUSTOM_ID } from "#src/discord/components/inventory/inventoryState.js";
import { parseInventoryFilter } from "#src/game/services/inventory/index.js";
import { updateInventory } from "#src/interactions/inventory/update.js";

async function handleFilter(
  interaction: Parameters<StringSelectMenuHandler>[0],
): Promise<void> {
  if (!(await assertMessageAuthor(interaction))) return;

  const filter = parseInventoryFilter(interaction.values[0] ?? "");
  if (!filter) return;

  try {
    await updateInventory(interaction, filter);
  } catch (error) {
    logger.error(error, "Failed to update inventory from filter select");
  }
}

export default new Map<string, StringSelectMenuHandler>([
  [FILTER_SELECT_CUSTOM_ID, handleFilter],
]);
