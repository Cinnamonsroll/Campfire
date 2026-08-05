import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { GAME_FISH_REEL_ID, GAME_FISH_SELECT_ID } from "../../customIds.js";
import { IS_COMPONENTS_V2 } from "../../constants.js";
import { CAMPFIRE_ORANGE } from "../../../embeds/base.js";
import { markup } from "../../../utils/markup.js";
import { LOCATIONS } from "../../../game/data/locations.js";
import { ITEMS } from "../../../game/data/items.js";
import type { LocationDefinition } from "../../../game/types.js";
import type { FishReelResult } from "../../../game/activities/fish/fishService.js";
import {
  FISH_QUALITY_EMOJI,
  FISH_QUALITY_LABEL,
} from "../../../game/activities/fish/data.js";
import {
  buildActivityResultPayload,
  buildGameNoticePayload,
  buildLocationSelectRow,
  type GameComponentPayload,
} from "./buildGameComponents.js";

export function buildFishSelectPayload(
  locations: readonly LocationDefinition[],
  energy: number,
): GameComponentPayload {
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `🎣 ${markup.bold("Go Fishing")}`,
    ),
    new TextDisplayBuilder().setContent(
      `Cast a line and wait for a bite. Reel in quickly for the best catch!\n⚡ ${markup.bold("Energy")}: ${String(energy)} · costs 10`,
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
      GAME_FISH_SELECT_ID,
      locations,
      "Choose a fishing spot",
    ),
  );
  return { components: [container], flags: IS_COMPONENTS_V2 };
}

export function buildBitePayload(
  locationKey: string,
  energyAfter: number,
): GameComponentPayload {
  const location = LOCATIONS[locationKey];
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `🎣 ${markup.bold(location.name)}`,
    ),
    new TextDisplayBuilder().setContent(
      `Your line tugs sharply. ${markup.bold("A bite!")} Hit **Reel In** now!\n⚡ Energy: ${String(energyAfter)}`,
    ),
  );
  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder()
          .setCustomId(GAME_FISH_REEL_ID)
          .setLabel("🎣 Reel In")
          .setStyle(ButtonStyle.Primary),
      ],
    }),
  );
  return { components: [container], flags: IS_COMPONENTS_V2 };
}

export function buildFishResultPayload(
  result: FishReelResult,
): GameComponentPayload {
  const { quality, caught, location, energyBefore, energyAfter, rewards } =
    result;

  if (!caught) {
    return buildGameNoticePayload(
      `${FISH_QUALITY_EMOJI[quality]} The fish slipped the hook at the last second. Cast again when you're ready.`,
    );
  }

  const item = ITEMS[caught.itemKey];
  const header = `${FISH_QUALITY_EMOJI[quality]} ${markup.bold(
    `${FISH_QUALITY_LABEL[quality]} catch!`,
  )} · ${location.emoji} ${location.name}`;

  return buildActivityResultPayload({
    header,
    story: [
      `You reeled in ${markup.bold(item.emoji + " " + item.name)}${
        caught.quantity > 1 ? ` ×${String(caught.quantity)}` : ""
      }.`,
      quality === "perfect"
        ? "A flawless, picture-perfect cast. The fish barely knew what hit it."
        : quality === "great"
          ? "Sharp reflexes at the water's edge."
          : "You got it, even if it put up a fight.",
    ],
    summary: rewards.summary,
    energyBefore,
    energyAfter,
    progression: rewards.progression,
    footer: location.returnMessage,
  });
}
