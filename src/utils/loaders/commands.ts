import { Collection } from "discord.js";
import type { Command } from "#/types/index.js";
import {
  readdirSync,
  join,
  pathToFileURL,
  logger,
  loaderDirname,
} from "./index.js";

const __dirname = loaderDirname(import.meta);

export async function loadCommands(): Promise<Collection<string, Command>> {
  const commands = new Collection<string, Command>();
  const commandsPath = join(__dirname, "..", "..", "commands");

  const files = readdirSync(commandsPath, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        (entry.name.endsWith(".ts") || entry.name.endsWith(".js")),
    )
    .map((entry) => join(commandsPath, entry.name));

  const modules = await Promise.all(
    files.map(async (filePath) => {
      try {
        const mod = (await import(pathToFileURL(filePath).href)) as {
          default: Command;
        };
        return { filePath, command: mod.default };
      } catch (error) {
        logger.error({ file: filePath, error }, "Failed to load command");
        return null;
      }
    }),
  );

  for (const result of modules) {
    if (!result) continue;
    const { filePath, command } = result;

    if (!("data" in command) || !("execute" in command)) {
      logger.warn({ file: filePath }, "Command missing required fields");
      continue;
    }

    if (commands.has(command.data.name)) {
      logger.warn(
        { name: command.data.name, file: filePath },
        "Duplicate command name",
      );
      continue;
    }

    commands.set(command.data.name, command);
  }

  return commands;
}
