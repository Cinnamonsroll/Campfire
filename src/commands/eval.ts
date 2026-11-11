import {
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import type { Command } from "../types/index.js";
import { ownerIds } from "../config/index.js";
import { errorEmbed } from "../embeds/index.js";

const command: Command = {
  category: "owner",
  data: new SlashCommandBuilder()
    .setName("eval")
    .setDescription("Open the code evaluator (bot owners only)")
    .addStringOption((option) =>
      option
        .setName("language")
        .setDescription("Defaults to js; other languages use Piston")
        .setMaxLength(32),
    )
    .addIntegerOption((option) =>
      option
        .setName("depth")
        .setDescription("Object inspection depth (default 0)")
        .setMinValue(0)
        .setMaxValue(10),
    )
    .addStringOption((option) =>
      option
        .setName("highlight")
        .setDescription("Output syntax highlighting")
        .setMaxLength(32),
    )
    .addBooleanOption((option) =>
      option.setName("remote").setDescription("Run JS/TS on Piston too"),
    ),
  permissions: [
    {
      check: (interaction) => ownerIds.has(interaction.user.id),
      error: "Only bot owners can use this command.",
    },
  ],
  async execute({ interaction }) {
    if (!ownerIds.has(interaction.user.id)) {
      await interaction.reply({
        embeds: [errorEmbed("Only bot owners can use this command.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const language = (
      interaction.options.getString("language") ?? "js"
    ).replace(/[^a-zA-Z0-9_+-]/g, "");
    const highlight = (
      interaction.options.getString("highlight") ?? ""
    ).replace(/[^a-zA-Z0-9_+-]/g, "");
    const depth = interaction.options.getInteger("depth") ?? 0;
    const remote = interaction.options.getBoolean("remote") ? "1" : "0";
    await interaction.showModal(
      new ModalBuilder()
        .setCustomId(`eval|${String(depth)}|${remote}|${language}|${highlight}`)
        .setTitle("Campfire code evaluator")
        .addLabelComponents(
          new LabelBuilder()
            .setLabel("Code")
            .setTextInputComponent(
              new TextInputBuilder()
                .setCustomId("code")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder(
                  "return await client.users.fetch(interaction.user.id)",
                )
                .setRequired(true)
                .setMaxLength(4000),
            ),
        ),
    );
  },
};
export default command;
