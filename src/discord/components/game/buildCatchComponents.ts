import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import {
  GAME_CATCH_SELECT_ID,
  GAME_CATCH_STEP_PREFIX,
} from "../../customIds.js";
import { IS_COMPONENTS_V2 } from "../../constants.js";
import { CAMPFIRE_ORANGE } from "../../../embeds/base.js";
import { markup } from "../../../utils/markup.js";
import { ITEMS } from "../../../game/data/items.js";
import type { LocationDefinition } from "../../../game/types.js";
import {
  CATCH_DIRECTION_EMOJI,
  CATCH_DIRECTIONS,
  CATCH_ENERGY_COST,
} from "../../../game/activities/catch/data.js";
import type {
  CatchStartResult,
  CatchStepResult,
} from "../../../game/activities/catch/catchService.js";
import {
  buildActivityResultPayload,
  buildGameNoticePayload,
  buildLocationSelectRow,
  type GameComponentPayload,
} from "./buildGameComponents.js";

function directionButtons(
  disabled = false,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>({
    components: CATCH_DIRECTIONS.map((direction) =>
      new ButtonBuilder()
        .setCustomId(`${GAME_CATCH_STEP_PREFIX}|${direction}`)
        .setEmoji(CATCH_DIRECTION_EMOJI[direction])
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
    ),
  });
}

function sequenceDisplay(
  sequence: readonly string[],
  progress: number,
): string {
  return sequence
    .map((direction, index) =>
      index < progress
        ? `✅`
        : CATCH_DIRECTION_EMOJI[direction] ?? "·",
    )
    .join(" ");
}

export function buildCatchSelectPayload(
  locations: readonly LocationDefinition[],
  energy: number,
): GameComponentPayload {
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `🪲 ${markup.bold("Bug Catching")}`,
    ),
    new TextDisplayBuilder().setContent(
      `Follow each insect's movement pattern by pressing the arrows in order. Longer patterns hide rarer finds!\n⚡ ${markup.bold("Energy")}: ${String(energy)} · costs 5`,
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
      GAME_CATCH_SELECT_ID,
      locations,
      "Choose where to hunt",
    ),
  );
  return { components: [container], flags: IS_COMPONENTS_V2 };
}

export function buildCatchStartPayload(
  result: CatchStartResult,
): GameComponentPayload {
  const { insect, location } = result;
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `🪲 ${markup.bold(`${insect.emoji} ${insect.name}!`)}`,
    ),
    new TextDisplayBuilder().setContent(
      `A ${insect.name} darts through the air at ${location.name}. ${markup.bold(
        "Follow its movement pattern:",
      )}\n${sequenceDisplay(result.sequence, 0)}`,
    ),
  );
  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `Press the arrows below in order. One wrong move and it's gone!`,
    ),
  );
  container.addActionRowComponents(directionButtons());
  return { components: [container], flags: IS_COMPONENTS_V2 };
}

export function buildCatchStepPayload(
  result: CatchStepResult,
): GameComponentPayload {
  const { insect, step, sequence } = result;
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `🪲 ${markup.bold(`${insect.emoji} ${insect.name}`)}`,
    ),
    new TextDisplayBuilder().setContent(
      `Pattern: ${sequenceDisplay(sequence, step)}\nKeep going!`,
    ),
  );
  container.addActionRowComponents(directionButtons());
  return { components: [container], flags: IS_COMPONENTS_V2 };
}

export function buildCatchResultPayload(
  result: CatchStepResult,
): GameComponentPayload {
  const { insect, location, status, sequence, rewards } = result;

  if (status === "fled") {
    return buildGameNoticePayload(
      `${insect.emoji} The ${insect.name} darted away on the wrong move. Try again!`,
    );
  }

  if (!rewards) {
    return buildGameNoticePayload(
      `${insect.emoji} The ${insect.name} escaped at the last second. Try again!`,
    );
  }

  const item = ITEMS[insect.itemKey];
  return buildActivityResultPayload({
    header: `🪲 ${markup.bold(`Caught: ${item.emoji} ${item.name}`)} · ${location.emoji} ${location.name}`,
    story: [
      `You matched the pattern ${markup.inline(sequence.join(" · "))} and scooped up the ${insect.name}!`,
      item.description,
    ],
    summary: rewards.summary,
    energyBefore: result.energyAfter + CATCH_ENERGY_COST,
    energyAfter: result.energyAfter,
    progression: rewards.progression,
    footer: location.returnMessage,
  });
}
