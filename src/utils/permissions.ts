import {
  type ChatInputCommandInteraction,
  type PermissionResolvable,
} from "discord.js";
import type { PermissionCheck } from "#/types/index.js";
import { ownerIds } from "#/config/index.js";

export function userPermission(
  ...permissions: PermissionResolvable[]
): PermissionCheck {
  return {
    check(interaction) {
      if (!interaction.inCachedGuild()) return false;
      return interaction.member.permissions.has(permissions);
    },
    error: "You need additional permissions to use this command.",
  };
}

export function botPermission(
  ...permissions: PermissionResolvable[]
): PermissionCheck {
  return {
    async check(interaction) {
      if (!interaction.guild) return false;

      const me =
        interaction.guild.members.me ??
        (await interaction.guild.members.fetchMe());

      return me.permissions.has(permissions);
    },
    error: "I need additional permissions to run this command.",
  };
}

export function ownerOnly(): PermissionCheck {
  return {
    check(interaction) {
      if (ownerIds.size === 0) return false;
      return ownerIds.has(interaction.user.id);
    },
    error: "Only the bot owner can use this command.",
  };
}

export async function checkPermissions(
  interaction: ChatInputCommandInteraction,
  checks: PermissionCheck[],
): Promise<string | null> {
  for (const check of checks) {
    const passed = await check.check(interaction);
    if (!passed) return check.error;
  }
  return null;
}
