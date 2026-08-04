import { EmbedBuilder } from "discord.js";
import { campfireEmbed } from "./base.js";

export function energyRestoredEmbed(): EmbedBuilder {
  return campfireEmbed()
    .setTitle("☀️ Well Rested")
    .setDescription(
      "While you were away, you rested deeply by the campfire. Your energy has been fully restored.",
    );
}
