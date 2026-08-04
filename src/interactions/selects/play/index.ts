import type { StringSelectMenuHandler } from "#/types/index.js";
import { PLAY_LOCATION_SELECT_ID } from "#/discord/customIds.js";
import {
  buildAdventureResultPayload,
  buildPlayNoticePayload,
} from "#/discord/components/play/buildPlayComponents.js";
import {
  AdventureError,
  runAdventure,
} from "#/game/services/adventureService.js";
import { assertMessageAuthor } from "#/utils/interactionAuthor.js";
import { logger } from "#/utils/logger.js";

async function handlePlaySelect(
  interaction: Parameters<StringSelectMenuHandler>[0],
): Promise<void> {
  if (
    !(await assertMessageAuthor(
      interaction,
      "That trail isn't yours to wander.",
    ))
  ) {
    return;
  }

  const locationKey = interaction.values[0];
  if (!locationKey) return;

  await interaction.deferUpdate();

  try {
    const result = await runAdventure(interaction.user.id, locationKey);
    await interaction.editReply(buildAdventureResultPayload(result));
  } catch (error) {
    if (error instanceof AdventureError) {
      await interaction.editReply(buildPlayNoticePayload(error.message));
      return;
    }
    logger.error(error, "Failed to run adventure");
    await interaction.editReply(
      buildPlayNoticePayload(
        "Your adventure hit a snag. Try again in a moment.",
      ),
    );
  }
}

export default new Map<string, StringSelectMenuHandler>([
  [PLAY_LOCATION_SELECT_ID, handlePlaySelect],
]);
