import type { ButtonHandler } from "../../../types/index.js";
import {
  GAME_CATCH_STEP_PREFIX,
  GAME_FISH_REEL_ID,
  GAME_PHOTO_CAPTURE_ID,
} from "../../../discord/customIds.js";
import { buildGameNoticePayload } from "../../../discord/components/game/buildGameComponents.js";
import { buildFishResultPayload } from "../../../discord/components/game/buildFishComponents.js";
import {
  buildCatchResultPayload,
  buildCatchStepPayload,
} from "../../../discord/components/game/buildCatchComponents.js";
import { buildPhotoResultPayload } from "../../../discord/components/game/buildPhotographComponents.js";
import {
  findByDiscordId,
  type Player,
} from "../../../database/repositories/playerRepository.js";
import { ActivityError } from "../../../game/activities/rewards.js";
import { reelIn } from "../../../game/activities/fish/fishService.js";
import { pressDirection } from "../../../game/activities/catch/catchService.js";
import { capture } from "../../../game/activities/photograph/photographService.js";
import { assertMessageAuthor } from "../../../utils/interactionAuthor.js";
import { logger } from "../../../utils/logger.js";

const NO_CAMPER_MESSAGE =
  "No camper here yet. Use `/start` to begin your summer.";

async function resolvePlayer(
  interaction: Parameters<ButtonHandler>[0],
): Promise<Player | null> {
  const player = await findByDiscordId(interaction.user.id);
  if (!player) {
    await interaction.editReply(buildGameNoticePayload(NO_CAMPER_MESSAGE));
    return null;
  }
  return player;
}

async function handleFishReel(
  interaction: Parameters<ButtonHandler>[0],
): Promise<void> {
  if (
    !(await assertMessageAuthor(interaction, "That line isn't yours to reel."))
  ) {
    return;
  }

  await interaction.deferUpdate();

  try {
    const player = await resolvePlayer(interaction);
    if (!player) return;
    const result = await reelIn(player);
    await interaction.editReply(buildFishResultPayload(result));
  } catch (error) {
    if (error instanceof ActivityError) {
      await interaction.editReply(buildGameNoticePayload(error.message));
      return;
    }
    logger.error(error, "Failed to reel in fish");
    await interaction.editReply(
      buildGameNoticePayload("The line snapped. Try again in a moment."),
    );
  }
}

async function handleCatchStep(
  interaction: Parameters<ButtonHandler>[0],
): Promise<void> {
  if (
    !(await assertMessageAuthor(interaction, "That chase isn't yours."))
  ) {
    return;
  }

  const [, direction] = interaction.customId.split("|");
  if (!direction) return;

  await interaction.deferUpdate();

  try {
    const player = await resolvePlayer(interaction);
    if (!player) return;
    const result = await pressDirection(player, direction);

    if (result.status === "correct") {
      await interaction.editReply(buildCatchStepPayload(result));
    } else {
      await interaction.editReply(buildCatchResultPayload(result));
    }
  } catch (error) {
    if (error instanceof ActivityError) {
      await interaction.editReply(buildGameNoticePayload(error.message));
      return;
    }
    logger.error(error, "Failed to handle catch step");
    await interaction.editReply(
      buildGameNoticePayload("The chase slipped away. Try again."),
    );
  }
}

async function handlePhotoCapture(
  interaction: Parameters<ButtonHandler>[0],
): Promise<void> {
  if (
    !(await assertMessageAuthor(interaction, "That camera isn't yours."))
  ) {
    return;
  }

  await interaction.deferUpdate();

  try {
    const player = await resolvePlayer(interaction);
    if (!player) return;
    const result = await capture(player);
    await interaction.editReply(buildPhotoResultPayload(result));
  } catch (error) {
    if (error instanceof ActivityError) {
      await interaction.editReply(buildGameNoticePayload(error.message));
      return;
    }
    logger.error(error, "Failed to capture photo");
    await interaction.editReply(
      buildGameNoticePayload("The shot didn't take. Try again."),
    );
  }
}

export default new Map<string, ButtonHandler>([
  [GAME_FISH_REEL_ID, handleFishReel],
  [GAME_CATCH_STEP_PREFIX, handleCatchStep],
  [GAME_PHOTO_CAPTURE_ID, handlePhotoCapture],
]);
