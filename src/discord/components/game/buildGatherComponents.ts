import {
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { GAME_GATHER_SELECT_ID } from "../../customIds.js";
import { IS_COMPONENTS_V2 } from "../../constants.js";
import { CAMPFIRE_ORANGE } from "../../../embeds/base.js";
import { markup } from "../../../utils/markup.js";
import { ITEMS } from "../../../game/data/items.js";
import type { LocationDefinition } from "../../../game/types.js";
import type { GatherResult } from "../../../game/activities/gather/gatherService.js";
import {
  buildActivityResultPayload,
  buildLocationSelectRow,
  type GameComponentPayload,
} from "./buildGameComponents.js";

export function buildGatherSelectPayload(
  locations: readonly LocationDefinition[],
  energy: number,
): GameComponentPayload {
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `🧺 ${markup.bold("Go Gathering")}`,
    ),
    new TextDisplayBuilder().setContent(
      `Search the wilderness for materials to fuel your camp upgrades.\n⚡ ${markup.bold("Energy")}: ${String(energy)} · costs 10`,
    ),
  );
  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      locations
        .map(
          (location) =>
            `> ${location.emoji} ${markup.bold(location.name)}\n> ${location.description}`,
        )
        .join("\n"),
    ),
  );
  container.addActionRowComponents(
    buildLocationSelectRow(
      GAME_GATHER_SELECT_ID,
      locations,
      "Choose where to gather",
    ),
  );
  return { components: [container], flags: IS_COMPONENTS_V2 };
}

export function buildGatherResultPayload(
  result: GatherResult,
): GameComponentPayload {
  const { location, item, energyBefore, energyAfter, rewards } = result;
  const definition = ITEMS[item.itemKey];

  return buildActivityResultPayload({
    header: `🧺 ${markup.bold("Gathered")} · ${location.emoji} ${location.name}`,
    story: [
      `You scoured the area and found ${markup.bold(
        `${definition.emoji} ${definition.name}`,
      )}${item.quantity > 1 ? ` ×${String(item.quantity)}` : ""}.`,
      definition.description,
    ],
    summary: rewards.summary,
    energyBefore,
    energyAfter,
    progression: rewards.progression,
    footer: location.returnMessage,
  });
}
