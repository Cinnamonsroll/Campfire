import {
  ActionRowBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  type APIMessageTopLevelComponent,
  type JSONEncodable,
} from "discord.js";
import { IS_COMPONENTS_V2 } from "../discord/constants.js";
import { CAMPFIRE_ORANGE } from "../embeds/base.js";
import {
  formatEmptyJournal,
  formatJournalCategoryHeader,
  formatJournalEntries,
  formatJournalHeader,
  formatJournalSubtitle,
  type JournalCategoryView,
  type JournalEntry,
  type JournalFilter,
  type JournalFilterOption,
} from "../game/services/journal/index.js";
import { FILTER_SELECT_CUSTOM_ID } from "./journalState.js";
import type {
  FilledJournalRenderModel,
  JournalRenderModel,
} from "./buildJournalView.js";

const MAX_ENTRIES_PER_TEXT_DISPLAY = 4;

export interface JournalComponentPayload {
  readonly components: JSONEncodable<APIMessageTopLevelComponent>[];
  readonly flags: number;
}

function buildFilterSelectRow(
  filter: JournalFilter,
  options: readonly JournalFilterOption[],
): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>({
    components: [
      new StringSelectMenuBuilder()
        .setCustomId(FILTER_SELECT_CUSTOM_ID)
        .setPlaceholder("Filter by category")
        .addOptions(
          options.map((option) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(option.label)
              .setValue(option.value)
              .setEmoji(option.emoji)
              .setDefault(option.value === filter),
          ),
        ),
    ],
  });
}

function chunkEntries(
  entries: readonly JournalEntry[],
): readonly (readonly JournalEntry[])[] {
  const chunks: JournalEntry[][] = [];
  for (let i = 0; i < entries.length; i += MAX_ENTRIES_PER_TEXT_DISPLAY) {
    chunks.push(entries.slice(i, i + MAX_ENTRIES_PER_TEXT_DISPLAY));
  }
  return chunks;
}

function buildCategoryDisplays(
  section: JournalCategoryView,
): TextDisplayBuilder[] {
  const displays = [
    new TextDisplayBuilder().setContent(formatJournalCategoryHeader(section)),
  ];
  for (const chunk of chunkEntries(section.entries)) {
    displays.push(
      new TextDisplayBuilder().setContent(formatJournalEntries(chunk)),
    );
  }
  return displays;
}

function buildFilledContainer(
  model: FilledJournalRenderModel,
): ContainerBuilder {
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(formatJournalHeader(model.ownerName)),
    new TextDisplayBuilder().setContent(
      formatJournalSubtitle(model.totalDiscovered, model.totalEntries),
    ),
  );

  container.addSeparatorComponents(new SeparatorBuilder());

  model.sections.forEach((section, index) => {
    if (index > 0) {
      container.addSeparatorComponents(new SeparatorBuilder());
    }
    container.addTextDisplayComponents(...buildCategoryDisplays(section));
  });

  container.addActionRowComponents(
    buildFilterSelectRow(model.filter, model.filterOptions),
  );

  return container;
}

export function buildJournalComponents(
  model: JournalRenderModel,
): JournalComponentPayload {
  const container =
    model.kind === "empty"
      ? new ContainerBuilder()
          .setAccentColor(CAMPFIRE_ORANGE)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              formatEmptyJournal(model.ownerName),
            ),
          )
      : buildFilledContainer(model);

  return {
    components: [container],
    flags: IS_COMPONENTS_V2,
  };
}

export function buildNoticePayload(content: string): JournalComponentPayload {
  return {
    components: [
      new ContainerBuilder()
        .setAccentColor(CAMPFIRE_ORANGE)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content)),
    ],
    flags: IS_COMPONENTS_V2,
  };
}
