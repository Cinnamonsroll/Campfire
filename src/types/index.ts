import type {
  SlashCommandBuilder,
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import type { CommandContext, Guard } from "#src/guards/index.js";

export interface PermissionCheck {
  check: (
    interaction: CommandContext["interaction"],
  ) => boolean | Promise<boolean>;
  error: string;
}

export interface Command {
  data:
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (ctx: CommandContext) => Promise<void>;
  category?: string;
  permissions?: PermissionCheck[];
  guards?: Guard[];
}

export interface Event {
  name: string;
  once?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (...args: any[]) => void | Promise<void>;
}

export type ButtonHandler = (interaction: ButtonInteraction) => Promise<void>;

export type StringSelectMenuHandler = (
  interaction: StringSelectMenuInteraction,
) => Promise<void>;

export type ModalHandler = (
  interaction: ModalSubmitInteraction,
) => Promise<void>;
