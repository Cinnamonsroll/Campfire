import type {
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  User,
} from "discord.js";
import type { ProfileAssets } from "../images/index.js";

export async function resolveProfileAppearance(
  interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
  selected: User,
): Promise<{
  user: User;
  assets: ProfileAssets;
  staticAvatarUrl: string;
  displayName: string;
}> {
  const [user, member] = await Promise.all([
    interaction.client.users.fetch(selected.id),
    interaction.guild
      ? interaction.guild.members.fetch(selected.id).catch(() => null)
      : null,
  ]);
  const avatarUrl =
    member?.displayAvatarURL({ size: 256 }) ??
    user.displayAvatarURL({ size: 256 });
  const decorationUrl =
    member?.displayAvatarDecorationURL() ?? user.avatarDecorationURL();
  const staticAvatarUrl =
    member?.displayAvatarURL({
      extension: "png",
      size: 256,
      forceStatic: true,
    }) ??
    user.displayAvatarURL({ extension: "png", size: 256, forceStatic: true });
  return {
    user,
    staticAvatarUrl,
    displayName: member?.displayName ?? user.globalName ?? user.username,
    assets: {
      avatarUrl,
      decorationUrl: decorationUrl
        ? `${decorationUrl}${decorationUrl.includes("?") ? "&" : "?"}size=256`
        : null,
    },
  };
}
