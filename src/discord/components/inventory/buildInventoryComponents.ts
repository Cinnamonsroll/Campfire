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
import { IS_COMPONENTS_V2 } from "#/discord/constants.js";
import { CAMPFIRE_ORANGE } from "#/embeds/base.js";
import {
  formatCategoryHeader,
  formatEmptyInventory,
  formatInventoryHeader,
  formatInventorySubtitle,
  formatItemLines,
  type InventoryCategoryView,
  type InventoryFilter,
  type InventoryFilterOption,
  type InventoryItemView,
} from "#/game/services/inventory/index.js";
import { FILTER_SELECT_CUSTOM_ID } from "./inventoryState.js";
import type {
  FilledInventoryRenderModel,
  InventoryRenderModel,
} from "./buildInventoryView.js";

const MAX_ITEMS_PER_TEXT_DISPLAY = 6;

export interface InventoryComponentPayload {
  readonly components: JSONEncodable<APIMessageTopLevelComponent>[];
  readonly flags: number;
}

function buildFilterSelectRow(
  filter: InventoryFilter,
  options: readonly InventoryFilterOption[],
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

function chunkItems(
  items: readonly InventoryItemView[],
): readonly (readonly InventoryItemView[])[] {
  const chunks: InventoryItemView[][] = [];
  for (let i = 0; i < items.length; i += MAX_ITEMS_PER_TEXT_DISPLAY) {
    chunks.push(items.slice(i, i + MAX_ITEMS_PER_TEXT_DISPLAY));
  }
  return chunks;
}

function buildCategoryDisplays(
  section: InventoryCategoryView,
): TextDisplayBuilder[] {
  const displays = [
    new TextDisplayBuilder().setContent(formatCategoryHeader(section)),
  ];
  for (const chunk of chunkItems(section.items)) {
    displays.push(new TextDisplayBuilder().setContent(formatItemLines(chunk)));
  }
  return displays;
}

function buildFilledContainer(
  model: FilledInventoryRenderModel,
): ContainerBuilder {
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(formatInventoryHeader(model.ownerName)),
    new TextDisplayBuilder().setContent(formatInventorySubtitle()),
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

export function buildInventoryComponents(
  model: InventoryRenderModel,
): InventoryComponentPayload {
  const container =
    model.kind === "empty"
      ? new ContainerBuilder()
          .setAccentColor(CAMPFIRE_ORANGE)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              formatEmptyInventory(model.ownerName),
            ),
          )
      : buildFilledContainer(model);

  return {
    components: [container],
    flags: IS_COMPONENTS_V2,
  };
}

export function buildNoticePayload(content: string): InventoryComponentPayload {
  return {
    components: [
      new ContainerBuilder()
        .setAccentColor(CAMPFIRE_ORANGE)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content)),
    ],
    flags: IS_COMPONENTS_V2,
  };
}
