import {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";
import type {
  Command,
  ButtonHandler,
  ModalHandler,
  StringSelectMenuHandler,
} from "./types/index.js";
import { env } from "./config/index.js";
import { pool } from "./database/client.js";
import { connectRedis, disconnectRedis } from "./redis/client.js";
import { logger } from "./utils/logger.js";
import { loadCommands } from "./utils/loaders/commands.js";
import { loadEvents } from "./utils/loaders/events.js";
import { join, dirname } from "node:path";
import { GlobalFonts } from "@napi-rs/canvas";
import { fileURLToPath } from "node:url";
import {
  loadInteractionHandlers,
  interactionsDir,
} from "./utils/loaders/interactions.js";
import { existsSync } from "node:fs";

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
    buttonHandlers: Map<string, ButtonHandler>;
    modalHandlers: Map<string, ModalHandler>;
    selectHandlers: Map<string, StringSelectMenuHandler>;
  }
}

async function main(): Promise<void> {
  const commands = await loadCommands();
  const events = await loadEvents();

  const [buttonHandlers, modalHandlers, selectHandlers] = await Promise.all([
    loadInteractionHandlers<ButtonHandler>(join(interactionsDir(), "buttons")),
    loadInteractionHandlers<ModalHandler>(join(interactionsDir(), "modals")),
    loadInteractionHandlers<StringSelectMenuHandler>(
      join(interactionsDir(), "selects"),
    ),
  ]);

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.commands = commands;
  client.buttonHandlers = buttonHandlers;
  client.modalHandlers = modalHandlers;
  client.selectHandlers = selectHandlers;

  for (const event of events) {
    client[event.once ? "once" : "on"](
      event.name,
      (...args: unknown[]) => void event.execute(...args),
    );
  }

  const rest = new REST().setToken(env.DISCORD_TOKEN);

  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    GlobalFonts.registerFromPath(
      join(__dirname, "images", "assets", "fonts", "SegoeUI.ttf"),
      "Segoe UI",
    );
    GlobalFonts.registerFromPath(
      join(__dirname, "images", "assets", "fonts", "SegoeUIBold.ttf"),
      "Segoe UI",
    );
    // console.log("Fonts registered", GlobalFonts.families);
    const fontPath = join(
  __dirname,
  "images",
  "assets",
  "fonts",
  "SegoeUI.ttf",
);

console.log(fontPath);
console.log(existsSync(fontPath));
    logger.info("Registering global slash commands");
    await rest.put(Routes.applicationCommands(env.CLIENT_ID), {
      body: commands.map((cmd) => cmd.data.toJSON()),
    });
    logger.info("Global slash commands registered");
  } catch (error) {
    logger.error(error, "Failed to register slash commands");
  }

  try {
    await pool.query("SELECT 1");
    logger.info("Connected to PostgreSQL");

    await connectRedis();
  } catch (error) {
    logger.error(error, "Failed to connect to database or Redis");
    process.exit(1);
  }

  await client.login(env.DISCORD_TOKEN);
}

main().catch((error: unknown) => {
  logger.error(error, "Fatal startup error");
  process.exit(1);
});

async function shutdown(): Promise<void> {
  logger.info("Shutting down...");
  await pool.end();
  await disconnectRedis();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
