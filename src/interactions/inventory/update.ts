import type { MessageComponentInteraction } from "discord.js";
import { findByDiscordId } from "#src/database/repositories/playerRepository.js";
import { buildInventoryReply } from "#src/discord/components/inventory/buildInventoryView.js";
import { buildNoticePayload } from "#src/discord/components/inventory/buildInventoryComponents.js";
import type { InventoryFilter } from "#src/game/services/inventory/index.js";

const NO_CAMPER_MESSAGE =
  "No camper here yet. Use `/start` to begin your summer.";

export async function updateInventory(
  interaction: MessageComponentInteraction,
  filter: InventoryFilter,
): Promise<void> {
  const player = await findByDiscordId(interaction.user.id);
  if (!player) {
    await interaction.update(buildNoticePayload(NO_CAMPER_MESSAGE));
    return;
  }

  const payload = await buildInventoryReply(player, filter);
  await interaction.update(payload);
}
