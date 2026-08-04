import { EmbedBuilder } from "discord.js";

export const CAMPFIRE_ORANGE = 0xe67e22;
export const CAMPFIRE_RED = 0xe74c3c;

export function campfireEmbed(): EmbedBuilder {
  return new EmbedBuilder().setColor(CAMPFIRE_ORANGE);
}

export function errorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(CAMPFIRE_RED)
    .setTitle("Something went wrong")
    .setDescription(message);
}
