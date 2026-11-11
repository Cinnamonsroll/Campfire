import { SlashCommandBuilder } from "discord.js";
import { campfireEmbed } from "../embeds/index.js";
import { pool } from "../database/client.js";
import { markup } from "../utils/markup.js";
import type { Command } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { reportError, flushVanta, vanta } from "../utils/vanta.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot latency"),
  async execute(ctx) {
    await ctx.interaction.reply({
      embeds: [
        campfireEmbed()
          .setTitle("Warming up the fire...")
          .setDescription(
            "Measuring round trip, database ping, and websocket heartbeat.",
          ),
      ],
    });

    const sent = await ctx.interaction.fetchReply();
    const roundtripMs =
      sent.createdTimestamp - ctx.interaction.createdTimestamp;

    let dbMs: number | null = null;
    try {
      const dbStart = performance.now();
      await pool.query("SELECT 1");
      dbMs = performance.now() - dbStart;
    } catch (error) {
      logger.error(error, "Database ping failed");
      reportError(error);
    }

    const wsMs = ctx.interaction.client.ws.ping;

    const embed = campfireEmbed()
      .setTitle("🔥 Campfire is crackling!")
      .setDescription("Here's how warm the fire is burning:");
    embed.addFields(
      {
        name: "📨 Round Trip",
        value: markup.inline(`${String(roundtripMs)}ms`),
        inline: true,
      },
      {
        name: "💚 WebSocket",
        value: markup.inline(`${String(wsMs)}ms`),
        inline: true,
      },
      {
        name: "🗄️ Database",
        value:
          dbMs !== null
            ? markup.inline(`${String(Math.round(dbMs))}ms`)
            : markup.inline("N/A"),
        inline: true,
      },
    );

    await ctx.interaction.editReply({ embeds: [embed] });

    try {
      const measurements: Promise<void>[] = [
        vanta.measure({
          name: "ping.roundtrip",
          value: roundtripMs,
          unit: "ms",
          tags: { type: "roundtrip" },
        }),
      ];
      if (wsMs >= 0) {
        measurements.push(
          vanta.measure({
            name: "ping.websocket",
            value: wsMs,
            unit: "ms",
            tags: { type: "websocket" },
          }),
        );
      }
      if (dbMs !== null) {
        measurements.push(
          vanta.measure({
            name: "ping.database",
            value: dbMs,
            unit: "ms",
            tags: { type: "database" },
          }),
        );
      }
      await Promise.all(measurements);
      await flushVanta();
    } catch (error) {
      logger.error(error, "Failed to record Vanta latency metrics");
      reportError(error);
    }
  },
};

export default command;
