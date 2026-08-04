import {
  Events,
  MessageFlags,
  type Interaction,
  type InteractionReplyOptions,
} from "discord.js";
import type { Event } from "#/types/index.js";
import { runGuards, type CommandContext } from "#/guards/index.js";
import { checkPermissions } from "#/utils/permissions.js";
import { energyRestoredEmbed, errorEmbed } from "#/embeds/index.js";
import { tryPassiveRestore } from "#/game/services/shop/index.js";
import { logger } from "#/utils/logger.js";

async function replyError(
  interaction: Interaction,
  message: string,
): Promise<void> {
  try {
    if (!interaction.isRepliable()) return;
    const payload: InteractionReplyOptions = {
      embeds: [errorEmbed(message)],
      flags: MessageFlags.Ephemeral,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch {
    // interaction expired
  }
}

const event: Event = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (interaction.isButton()) {
      const prefix = interaction.customId.split("|")[0] ?? "";
      const handler =
        interaction.client.buttonHandlers.get(interaction.customId) ??
        interaction.client.buttonHandlers.get(prefix);
      if (handler) {
        try {
          await handler(interaction);
        } catch (error) {
          logger.error(error, "Error handling button interaction");
          await replyError(
            interaction,
            "Something went wrong while processing that action.",
          );
        }
      }
      return;
    }

    if (interaction.isStringSelectMenu()) {
      const prefix = interaction.customId.split("|")[0] ?? "";
      const handler =
        interaction.client.selectHandlers.get(interaction.customId) ??
        interaction.client.selectHandlers.get(prefix);
      if (handler) {
        try {
          await handler(interaction);
        } catch (error) {
          logger.error(error, "Error handling select menu interaction");
          await replyError(
            interaction,
            "Something went wrong while processing that selection.",
          );
        }
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      const prefix = interaction.customId.split("|")[0] ?? "";
      const handler =
        interaction.client.modalHandlers.get(interaction.customId) ??
        interaction.client.modalHandlers.get(prefix);
      if (handler) {
        try {
          await handler(interaction);
        } catch (error) {
          logger.error(error, "Error handling modal submission");
          await replyError(
            interaction,
            "Something went wrong while processing that form.",
          );
        }
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`No command found: ${interaction.commandName}`);
      return;
    }

    const ctx: CommandContext = { interaction };

    if (command.permissions && command.permissions.length > 0) {
      const error = await checkPermissions(interaction, command.permissions);
      if (error) {
        await interaction.reply({
          embeds: [errorEmbed(error)],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    if (command.guards && command.guards.length > 0) {
      const error = await runGuards(ctx, command.guards);
      if (error) {
        await interaction.reply({
          embeds: [errorEmbed(error)],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    let energyRestored = false;
    if (ctx.player) {
      try {
        energyRestored = await tryPassiveRestore(ctx.player);
      } catch (error) {
        logger.error(error, "Failed to restore passive energy");
      }
    }

    try {
      await command.execute(ctx);
    } catch (error) {
      logger.error(error, "Error executing command");
      await replyError(
        interaction,
        "Something went wrong while executing that command.",
      );
    }

    if (energyRestored) {
      try {
        await interaction.followUp({
          embeds: [energyRestoredEmbed()],
          flags: MessageFlags.Ephemeral,
        });
      } catch {
        // interaction expired
      }
    }
  },
};

export default event;
