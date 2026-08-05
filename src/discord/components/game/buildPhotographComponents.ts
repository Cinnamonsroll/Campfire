import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import {
  GAME_PHOTO_CAPTURE_ID,
  GAME_PHOTO_SELECT_ID,
} from "../../customIds.js";
import { IS_COMPONENTS_V2 } from "../../constants.js";
import { CAMPFIRE_ORANGE } from "../../../embeds/base.js";
import { markup } from "../../../utils/markup.js";
import type { LocationDefinition } from "../../../game/types.js";
import {
  PHOTO_ENERGY_COST,
  PHOTO_QUALITY_EMOJI,
  PHOTO_QUALITY_LABEL,
} from "../../../game/activities/photograph/data.js";
import type {
  PhotoResult,
  PhotoStartResult,
} from "../../../game/activities/photograph/photographService.js";
import {
  buildActivityResultPayload,
  buildGameNoticePayload,
  buildLocationSelectRow,
  type GameComponentPayload,
} from "./buildGameComponents.js";

export function buildPhotoSelectPayload(
  locations: readonly LocationDefinition[],
  energy: number,
): GameComponentPayload {
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `📷 ${markup.bold("Wildlife Photography")}`,
    ),
    new TextDisplayBuilder().setContent(
      `Wildlife is out there. Capture it before it disappears · the quicker the shot, the better the quality!\n⚡ ${markup.bold("Energy")}: ${String(energy)} · costs 5`,
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
      GAME_PHOTO_SELECT_ID,
      locations,
      "Choose a spot to shoot",
    ),
  );
  return { components: [container], flags: IS_COMPONENTS_V2 };
}

export function buildPhotoStartPayload(
  result: PhotoStartResult,
): GameComponentPayload {
  const { wildlife, location, energyAfter } = result;
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `${location.emoji} ${markup.bold(location.name)}`,
    ),
    new TextDisplayBuilder().setContent(
      `${wildlife.emoji} A ${markup.bold(wildlife.name)} has appeared!`,
    ),
    new TextDisplayBuilder().setContent(
      markup.italic(`Snap it fast before it slips away.`),
    ),
  );
  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder()
          .setCustomId(GAME_PHOTO_CAPTURE_ID)
          .setLabel("📷 Capture!")
          .setStyle(ButtonStyle.Primary),
      ],
    }),
  );
  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`⚡ Energy: ${String(energyAfter)}`),
  );
  return { components: [container], flags: IS_COMPONENTS_V2 };
}

export function buildPhotoResultPayload(
  result: PhotoResult,
): GameComponentPayload {
  const { quality, wildlife, location, albumUpdated, rewards } = result;

  if (quality === "missed") {
    return buildGameNoticePayload(
      `${wildlife.emoji} The ${wildlife.name} vanished before you could focus. Try again!`,
    );
  }

  if (!rewards) {
    return buildGameNoticePayload(
      `${wildlife.emoji} The ${wildlife.name} got away without a shot. Try again!`,
    );
  }

  const albumLine = albumUpdated
    ? `📖 ${markup.bold("Wildlife Album")}\n${wildlife.emoji} ${wildlife.name} added · ${location.emoji} ${location.name} · ${PHOTO_QUALITY_LABEL[quality]}`
    : "";

  const story: string[] = [
    `You framed the shot just in time · ${PHOTO_QUALITY_EMOJI[quality]} ${markup.bold(
      `${PHOTO_QUALITY_LABEL[quality]} shot`,
    )} of a ${wildlife.name}!`,
    albumLine,
  ].filter(Boolean);

  return buildActivityResultPayload({
    header: `📷 ${markup.bold(`Photographed: ${wildlife.emoji} ${wildlife.name}`)} · ${location.emoji} ${location.name}`,
    story,
    summary: rewards.summary,
    energyBefore: result.energyAfter + PHOTO_ENERGY_COST,
    energyAfter: result.energyAfter,
    progression: rewards.progression,
    footer: location.returnMessage,
  });
}
