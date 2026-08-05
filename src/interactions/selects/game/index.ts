import type { StringSelectMenuHandler } from "../../../types/index.js";
import {
  GAME_CATCH_SELECT_ID,
  GAME_COOK_SELECT_ID,
  GAME_FISH_SELECT_ID,
  GAME_GATHER_SELECT_ID,
  GAME_PHOTO_SELECT_ID,
} from "../../../discord/customIds.js";
import { buildGameNoticePayload } from "../../../discord/components/game/buildGameComponents.js";
import { buildBitePayload } from "../../../discord/components/game/buildFishComponents.js";
import { buildGatherResultPayload } from "../../../discord/components/game/buildGatherComponents.js";
import { buildCookResultPayload } from "../../../discord/components/game/buildCookComponents.js";
import { buildCatchStartPayload } from "../../../discord/components/game/buildCatchComponents.js";
import { buildPhotoStartPayload } from "../../../discord/components/game/buildPhotographComponents.js";
import { findByDiscordId } from "../../../database/repositories/playerRepository.js";
import { getMaxEnergyForPlayer } from "../../../game/services/shop/index.js";
import {
  ActivityError,
} from "../../../game/activities/rewards.js";
import {
  markBite,
  startFishing,
} from "../../../game/activities/fish/fishService.js";
import { castDelayMs } from "../../../game/activities/fish/data.js";
import { gather } from "../../../game/activities/gather/gatherService.js";
import { cook } from "../../../game/activities/cook/cookService.js";
import { startCatching } from "../../../game/activities/catch/catchService.js";
import { startPhotographing } from "../../../game/activities/photograph/photographService.js";
import { assertMessageAuthor } from "../../../utils/interactionAuthor.js";
import { sleep } from "../../../utils/sleep.js";
import { logger } from "../../../utils/logger.js";

const NO_CAMPER_MESSAGE =
  "No camper here yet. Use `/start` to begin your summer.";

async function handleFishSelect(
  interaction: Parameters<StringSelectMenuHandler>[0],
): Promise<void> {
  if (
    !(await assertMessageAuthor(interaction, "That fishing spot isn't yours."))
  ) {
    return;
  }

  const locationKey = interaction.values[0];
  if (!locationKey) return;

  await interaction.deferUpdate();

  try {
    const player = await findByDiscordId(interaction.user.id);
    if (!player) {
      await interaction.editReply(buildGameNoticePayload(NO_CAMPER_MESSAGE));
      return;
    }

    const session = await startFishing(player, locationKey);
    await sleep(castDelayMs());
    const withBite = await markBite(player, session);
    await interaction.editReply(
      buildBitePayload(locationKey, withBite.energyAfter),
    );
  } catch (error) {
    if (error instanceof ActivityError) {
      await interaction.editReply(buildGameNoticePayload(error.message));
      return;
    }
    logger.error(error, "Failed to start fishing");
    await interaction.editReply(
      buildGameNoticePayload("Your line tangled. Try again in a moment."),
    );
  }
}

async function handleGatherSelect(
  interaction: Parameters<StringSelectMenuHandler>[0],
): Promise<void> {
  if (
    !(await assertMessageAuthor(interaction, "That spot isn't yours to pick."))
  ) {
    return;
  }

  const locationKey = interaction.values[0];
  if (!locationKey) return;

  await interaction.deferUpdate();

  try {
    const player = await findByDiscordId(interaction.user.id);
    if (!player) {
      await interaction.editReply(buildGameNoticePayload(NO_CAMPER_MESSAGE));
      return;
    }

    const result = await gather(player, locationKey);
    await interaction.editReply(buildGatherResultPayload(result));
  } catch (error) {
    if (error instanceof ActivityError) {
      await interaction.editReply(buildGameNoticePayload(error.message));
      return;
    }
    logger.error(error, "Failed to gather");
    await interaction.editReply(
      buildGameNoticePayload("You came back empty-handed. Try again."),
    );
  }
}

async function handleCookSelect(
  interaction: Parameters<StringSelectMenuHandler>[0],
): Promise<void> {
  if (
    !(await assertMessageAuthor(interaction, "That kitchen isn't yours."))
  ) {
    return;
  }

  const recipeKey = interaction.values[0];
  if (!recipeKey) return;

  await interaction.deferUpdate();

  try {
    const player = await findByDiscordId(interaction.user.id);
    if (!player) {
      await interaction.editReply(buildGameNoticePayload(NO_CAMPER_MESSAGE));
      return;
    }

    const result = await cook(player, recipeKey);
    const maxEnergy = await getMaxEnergyForPlayer(player);
    await interaction.editReply(buildCookResultPayload(result, maxEnergy));
  } catch (error) {
    if (error instanceof ActivityError) {
      await interaction.editReply(buildGameNoticePayload(error.message));
      return;
    }
    logger.error(error, "Failed to cook");
    await interaction.editReply(
      buildGameNoticePayload("The pot boiled over. Try again."),
    );
  }
}

async function handleCatchSelect(
  interaction: Parameters<StringSelectMenuHandler>[0],
): Promise<void> {
  if (
    !(await assertMessageAuthor(interaction, "That hunt isn't yours."))
  ) {
    return;
  }

  const locationKey = interaction.values[0];
  if (!locationKey) return;

  await interaction.deferUpdate();

  try {
    const player = await findByDiscordId(interaction.user.id);
    if (!player) {
      await interaction.editReply(buildGameNoticePayload(NO_CAMPER_MESSAGE));
      return;
    }

    const result = await startCatching(player, locationKey);
    await interaction.editReply(buildCatchStartPayload(result));
  } catch (error) {
    if (error instanceof ActivityError) {
      await interaction.editReply(buildGameNoticePayload(error.message));
      return;
    }
    logger.error(error, "Failed to start bug catching");
    await interaction.editReply(
      buildGameNoticePayload("The insect slipped away. Try again."),
    );
  }
}

async function handlePhotoSelect(
  interaction: Parameters<StringSelectMenuHandler>[0],
): Promise<void> {
  if (
    !(await assertMessageAuthor(interaction, "That shot isn't yours to take."))
  ) {
    return;
  }

  const locationKey = interaction.values[0];
  if (!locationKey) return;

  await interaction.deferUpdate();

  try {
    const player = await findByDiscordId(interaction.user.id);
    if (!player) {
      await interaction.editReply(buildGameNoticePayload(NO_CAMPER_MESSAGE));
      return;
    }

    const result = await startPhotographing(player, locationKey);
    await interaction.editReply(buildPhotoStartPayload(result));
  } catch (error) {
    if (error instanceof ActivityError) {
      await interaction.editReply(buildGameNoticePayload(error.message));
      return;
    }
    logger.error(error, "Failed to start photographing");
    await interaction.editReply(
      buildGameNoticePayload("The wildlife scattered. Try again."),
    );
  }
}

export default new Map<string, StringSelectMenuHandler>([
  [GAME_FISH_SELECT_ID, handleFishSelect],
  [GAME_GATHER_SELECT_ID, handleGatherSelect],
  [GAME_COOK_SELECT_ID, handleCookSelect],
  [GAME_CATCH_SELECT_ID, handleCatchSelect],
  [GAME_PHOTO_SELECT_ID, handlePhotoSelect],
]);
