import type { StringSelectMenuHandler } from "../../../types/index.js";
import { CAMP_UPGRADE_SELECT_ID } from "../../../discord/customIds.js";
import {
  buildCampsiteNoticePayload,
  buildUpgradeErrorContainer,
  buildUpgradeResultContainer,
  campsitePayload,
} from "../../../discord/components/camp/buildCampComponents.js";
import { generateCampsiteCard } from "../../../images/index.js";
import { findByDiscordId } from "../../../database/repositories/playerRepository.js";
import type { Player } from "../../../database/repositories/playerRepository.js";
import type { PlayerCamp } from "../../../database/repositories/campRepository.js";
import { getCampsite } from "../../../game/services/campService.js";
import {
  getCampRow,
  performUpgrade,
  UpgradeError,
  type UpgradeResult,
} from "../../../game/services/upgradeService.js";
import { evaluateAndAwardAchievements } from "../../../game/services/progressionService.js";
import { withTransaction } from "../../../database/transaction.js";
import { assertMessageAuthor } from "../../../utils/interactionAuthor.js";
import { logger } from "../../../utils/logger.js";
import type { AchievementDefinition, CampBuildingKey } from "../../../game/types.js";

interface UpgradeOutcome {
  result: UpgradeResult;
  achievements: AchievementDefinition[];
}

async function runUpgrade(
  player: Player,
  camp: PlayerCamp,
  key: CampBuildingKey,
): Promise<UpgradeOutcome> {
  return withTransaction(async (tx) => {
    const result = await performUpgrade(player, camp, key, tx);
    const { achievements } = await evaluateAndAwardAchievements(player, tx);
    return { result, achievements };
  });
}

async function handleUpgradeSelect(
  interaction: Parameters<StringSelectMenuHandler>[0],
): Promise<void> {
  if (
    !(await assertMessageAuthor(
      interaction,
      "This campsite isn't yours to tend.",
    ))
  ) {
    return;
  }

  const key = interaction.values[0] as CampBuildingKey | undefined;
  if (!key) return;

  await interaction.deferUpdate();

  try {
    const player = await findByDiscordId(interaction.user.id);
    if (!player) {
      await interaction.editReply(
        buildCampsiteNoticePayload(
          "No camper here yet. Use `/start` to begin your summer.",
        ),
      );
      return;
    }

    const camp = await getCampRow(player.id);

    let outcome: UpgradeOutcome;
    try {
      outcome = await runUpgrade(player, camp, key);
    } catch (error) {
      if (error instanceof UpgradeError) {
        const campsite = await getCampsite(player);
        const cardBuffer = await generateCampsiteCard(campsite);
        await interaction.editReply({
          ...campsitePayload(
            campsite.characterName,
            camp,
            buildUpgradeErrorContainer(error, player.coins),
          ),
          files: [{ attachment: cardBuffer, name: "campsite_card.png" }],
        });
        return;
      }
      throw error;
    }

    const campsite = await getCampsite(player);
    const cardBuffer = await generateCampsiteCard(campsite);
    const updatedCamp = await getCampRow(player.id);

    await interaction.editReply({
      ...campsitePayload(
        campsite.characterName,
        updatedCamp,
        buildUpgradeResultContainer(
          outcome.result,
          player.coins,
          outcome.achievements,
        ),
      ),
      files: [{ attachment: cardBuffer, name: "campsite_card.png" }],
    });
  } catch (error) {
    logger.error(error, "Failed to upgrade building");
    await interaction.editReply(
      buildCampsiteNoticePayload(
        "The upgrade didn't take. Try again in a moment.",
      ),
    );
  }
}

export default new Map<string, StringSelectMenuHandler>([
  [CAMP_UPGRADE_SELECT_ID, handleUpgradeSelect],
]);
