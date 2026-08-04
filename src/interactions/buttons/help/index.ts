import type { ButtonHandler } from "#/types/index.js";
import { HELP_PAGE_PREFIX } from "#/discord/customIds.js";
import { buildHelpPayload } from "#/discord/components/help/buildHelpComponents.js";
import { assertMessageAuthor } from "#/utils/interactionAuthor.js";
import { logger } from "#/utils/logger.js";

async function handleHelpPage(
  interaction: Parameters<ButtonHandler>[0],
): Promise<void> {
  if (!(await assertMessageAuthor(interaction, "That guide isn't yours."))) {
    return;
  }

  const index = Number(interaction.customId.split("|")[1]);
  if (Number.isNaN(index)) return;

  try {
    await interaction.update(buildHelpPayload(index));
  } catch (error) {
    logger.error(error, "Failed to flip help page");
  }
}

export default new Map<string, ButtonHandler>([
  [HELP_PAGE_PREFIX, handleHelpPage],
]);
