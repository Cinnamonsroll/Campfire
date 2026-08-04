import {
  LabelBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import type { ButtonHandler } from "../types/index.js";
import { locationVignette } from "../embeds/index.js";
import { logger } from "../utils/logger.js";
import { assertMessageAuthor } from "../utils/interactionAuthor.js";

async function handleContinue(
  interaction: Parameters<ButtonHandler>[0],
): Promise<void> {
  if (!(await assertMessageAuthor(interaction))) return;

  const modal = new ModalBuilder()
    .setCustomId("start_name_modal")
    .setTitle("Choose Your Camper Name")
    .addLabelComponents(
      new LabelBuilder()
        .setLabel("Camper Name")
        .setDescription("What should everyone call you?")
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("camper_name")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(2)
            .setMaxLength(20),
        ),
    );

  try {
    await interaction.showModal(modal);
  } catch (error) {
    logger.error(error, "Failed to show modal on continue button");
  }
}

async function handleLocation(
  interaction: Parameters<ButtonHandler>[0],
): Promise<void> {
  if (!(await assertMessageAuthor(interaction))) return;

  const key = interaction.customId.replace("start_", "");

  try {
    await interaction.update({
      embeds: [locationVignette(key)],
      components: [],
    });
  } catch (error) {
    logger.error(error, "Failed to update interaction for location button");
  }
}

export default new Map<string, ButtonHandler>([
  ["start_continue", handleContinue],
  ["start_beach", handleLocation],
  ["start_forest", handleLocation],
  ["start_camp", handleLocation],
]);
