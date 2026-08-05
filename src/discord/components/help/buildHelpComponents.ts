import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  type APIMessageTopLevelComponent,
  type JSONEncodable,
} from "discord.js";
import { IS_COMPONENTS_V2 } from "../../constants.js";
import { HELP_PAGE_PREFIX } from "../../customIds.js";
import { CAMPFIRE_ORANGE } from "../../../embeds/base.js";
import { markup } from "../../../utils/markup.js";
import { helpPages } from "./helpPages.js";

const PAGE_INDICATOR_ID = `${HELP_PAGE_PREFIX}_indicator`;

interface HelpComponentPayload {
  readonly components: JSONEncodable<APIMessageTopLevelComponent>[];
  readonly flags: number;
}

const HELP_PAGE_COUNT = helpPages.length;

function pageButton(
  label: string,
  index: number,
  disabled: boolean,
): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(`${HELP_PAGE_PREFIX}|${String(index)}`)
    .setLabel(label)
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);
}

export function buildHelpPayload(pageIndex: number): HelpComponentPayload {
  const safeIndex = Math.max(0, Math.min(pageIndex, HELP_PAGE_COUNT - 1));
  const page = helpPages[safeIndex];

  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `${page.emoji} ${markup.bold(page.title)}`,
    ),
    new TextDisplayBuilder().setContent(page.content),
  );

  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>({
      components: [
        pageButton("◀ Back", safeIndex - 1, safeIndex === 0),
        new ButtonBuilder()
          .setCustomId(PAGE_INDICATOR_ID)
          .setLabel(
            `Page ${String(safeIndex + 1)} of ${String(HELP_PAGE_COUNT)}`,
          )
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        pageButton("Next ▶", safeIndex + 1, safeIndex === HELP_PAGE_COUNT - 1),
      ],
    }),
  );

  return { components: [container], flags: IS_COMPONENTS_V2 };
}
