import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from "discord.js";
import { performance } from "node:perf_hooks";
import { ownerIds } from "../config/index.js";
import { campfireEmbed, errorEmbed } from "../embeds/index.js";
import { markup } from "./markup.js";
import {
  evaluateLocal,
  parseCode,
  type EvaluationContext,
} from "./evaluate.js";
import { PistonClient } from "./piston.js";
import { logger } from "./logger.js";
const piston = new PistonClient();
export function outputPages(output: string): string[] {
  const escaped =
    output.replace(/`/g, "`\u200b").replace(/@/g, "@\u200b") || "(no output)";
  const limited =
    escaped.length > 100_000
      ? `${escaped.slice(0, 100_000)}\n[Output truncated]`
      : escaped;
  return Array.from({ length: Math.ceil(limited.length / 1900) }, (_, i) =>
    limited.slice(i * 1900, (i + 1) * 1900),
  );
}

export interface EvalOptions {
  code: string;
  language?: string;
  highlight?: string;
  depth?: number;
  remote?: boolean;
}
export async function replyToEvaluation(
  ctx: EvaluationContext,
  options: EvalOptions,
): Promise<void> {
  const { interaction } = ctx;
  if (!ownerIds.has(interaction.user.id)) {
    await interaction.reply({
      embeds: [errorEmbed("Only bot owners can use this command.")],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const parsed = parseCode(options.code, options.language ?? "js");
  const highlight = (options.highlight ?? parsed.language)
    .replace(/[^a-zA-Z0-9_+-]/g, "")
    .slice(0, 32);
  const start = performance.now();
  let output: string;
  let type = "string";
  let failed = false;
  try {
    if (!parsed.code.trim()) throw new Error("Provide some code to evaluate.");
    if (
      ["js", "javascript", "ts", "typescript"].includes(parsed.language) &&
      !options.remote
    ) {
      const result = await evaluateLocal(
        parsed.code,
        parsed.language,
        ctx,
        options.depth ?? 0,
      );
      output = result.output;
      type = result.type;
    } else {
      const result = await piston.execute(parsed.code, parsed.language);
      output = [
        result.compiler ? `Compiler:\n${result.compiler}` : "",
        result.console,
      ]
        .filter(Boolean)
        .join("\n");
      failed = result.error;
    }
  } catch (error) {
    failed = true;
    output =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);
  }

  for (const [name, secret] of Object.entries(process.env)) {
    if (
      secret &&
      secret.length >= 8 &&
      /TOKEN|SECRET|PASSWORD|API_KEY|DATABASE_URL|REDIS_URL/i.test(name)
    ) {
      output = output.split(secret).join("[REDACTED]");
    }
  }
  const elapsed = `${(performance.now() - start).toFixed(2)}ms`;
  const pages = outputPages(output);
  let page = 0;
  const controls = (disabled = false): ActionRowBuilder<ButtonBuilder>[] =>
    pages.length <= 1
      ? []
      : [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("eval:previous")
              .setLabel("Back")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(disabled || page === 0),
            new ButtonBuilder()
              .setCustomId("eval:page")
              .setLabel(`${String(page + 1)} / ${String(pages.length)}`)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("eval:next")
              .setLabel("Next")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(disabled || page === pages.length - 1),
          ),
        ];
  const embed = () =>
    (failed
      ? errorEmbed("").setTitle("Evaluation failed")
      : campfireEmbed().setTitle("Code evaluated")
    )
      .setDescription(markup.codeblock(pages[page], highlight))
      .addFields(
        { name: "Type", value: markup.codeblock(type, "js"), inline: true },
        {
          name: "Time",
          value: markup.codeblock(elapsed, "css"),
          inline: true,
        },
      )
      .setFooter({
        text: `Page ${String(page + 1)} of ${String(pages.length)}`,
      });
  const message = await interaction.editReply({
    embeds: [embed()],
    components: controls(),
    allowedMentions: { parse: [] },
  });
  if (pages.length <= 1) return;
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120_000,
    filter: (button) =>
      button.user.id === interaction.user.id &&
      ownerIds.has(button.user.id) &&
      ["eval:previous", "eval:next"].includes(button.customId),
  });
  collector.on("collect", (button) => {
    page = Math.max(
      0,
      Math.min(
        pages.length - 1,
        page + (button.customId === "eval:next" ? 1 : -1),
      ),
    );
    void button
      .update({
        embeds: [embed()],
        components: controls(),
        allowedMentions: { parse: [] },
      })
      .catch((error: unknown) => {
        logger.warn(error, "Failed to update eval page");
      });
  });
  collector.on("end", () => {
    void interaction
      .editReply({ components: controls(true) })
      .catch((error: unknown) => {
        logger.warn(error, "Failed to disable eval pagination");
      });
  });
}
