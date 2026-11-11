import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/index.js";
import { executeProfile } from "../discord/profiles.js";
const command: Command = {
  data: new SlashCommandBuilder()
    .setName("player")
    .setDescription("View a camper's profile card")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The camper to look up (defaults to yourself)"),
    ),
  async execute(ctx) {
    await executeProfile(ctx, false);
  },
};
export default command;
