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
import { IS_COMPONENTS_V2 } from "../../constants.js";
import { PLAY_LOCATION_SELECT_ID } from "../../customIds.js";
import { CAMPFIRE_ORANGE } from "../../../embeds/base.js";
import { rewardLines } from "../../../game/rewards/format.js";
import { getTitle } from "../../../game/utils/titles.js";
import { getUnlockedLocations } from "../../../game/services/locationService.js";
import type { LocationDefinition } from "../../../game/types.js";
import type { AdventureResult } from "../../../game/services/adventureService.js";
import { markup } from "../../../utils/markup.js";

const MIN_PLAY_ENERGY = 10;
const MAX_LINES_PER_TEXT_DISPLAY = 15;

export interface PlayComponentPayload {
  readonly components: JSONEncodable<APIMessageTopLevelComponent>[];
  readonly flags: number;
}

function chunkLocations(
  locations: readonly LocationDefinition[],
): readonly (readonly LocationDefinition[])[] {
  const chunks: LocationDefinition[][] = [];
  for (let i = 0; i < locations.length; i += 4) {
    chunks.push(locations.slice(i, i + 4));
  }
  return chunks;
}

function locationLines(locations: readonly LocationDefinition[]): string[] {
  return locations.map(
    (location) =>
      `> ${location.emoji} ${markup.bold(location.name)}\n> ${location.description}`,
  );
}

function buildLocationSelectRow(
  locations: readonly LocationDefinition[],
  placeholder: string,
): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>({
    components: [
      new StringSelectMenuBuilder()
        .setCustomId(PLAY_LOCATION_SELECT_ID)
        .setPlaceholder(placeholder)
        .addOptions(
          locations.map((location) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(location.name)
              .setValue(location.key)
              .setEmoji(location.emoji)
              .setDescription(location.description),
          ),
        ),
    ],
  });
}

function nextUnlockLevel(locked: readonly LocationDefinition[]): number | null {
  if (locked.length === 0) return null;
  return Math.min(...locked.map((location) => location.unlockLevel));
}

export function buildPlayReply(
  unlocked: readonly LocationDefinition[],
  locked: readonly LocationDefinition[],
  energy: number,
): PlayComponentPayload {
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `☀️ ${markup.bold("Where will you wander?")}`,
    ),
    new TextDisplayBuilder().setContent(
      `Sunlight spills through the pines and the whole forest hums with possibility.\n⚡ ${markup.bold("Energy")}: ${String(energy)}`,
    ),
  );

  container.addSeparatorComponents(new SeparatorBuilder());

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`🗺 ${markup.bold("Open Trails")}`),
  );
  for (const chunk of chunkLocations(unlocked)) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(locationLines(chunk).join("\n")),
    );
  }

  const nextUnlock = nextUnlockLevel(locked);
  if (nextUnlock !== null) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🔒 ${markup.bold("Locked Trails")}: ${String(locked.length)} still hidden · next unlocks at level ${String(nextUnlock)}`,
      ),
    );
  }

  container.addActionRowComponents(
    buildLocationSelectRow(unlocked, "Choose a trail to wander"),
  );

  return { components: [container], flags: IS_COMPONENTS_V2 };
}

function sectionDisplay(
  header: string,
  lines: readonly string[],
): TextDisplayBuilder[] {
  if (lines.length === 0) return [];

  const displays: TextDisplayBuilder[] = [];
  const chunkSize = MAX_LINES_PER_TEXT_DISPLAY;
  displays.push(
    new TextDisplayBuilder().setContent(
      `${header}\n${lines.slice(0, chunkSize).join("\n")}`,
    ),
  );
  for (let i = chunkSize; i < lines.length; i += chunkSize) {
    displays.push(
      new TextDisplayBuilder().setContent(
        lines.slice(i, i + chunkSize).join("\n"),
      ),
    );
  }
  return displays;
}

export function buildAdventureResultPayload(
  result: AdventureResult,
): PlayComponentPayload {
  const { location, encounter, summary, energyBefore, energyAfter } = result;

  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `${location.emoji} ${markup.bold(location.name)}`,
    ),
    new TextDisplayBuilder().setContent(
      `> ${encounter.flavorText}\n> ${encounter.resultText}`,
    ),
  );

  const rewards = rewardLines(summary);
  if (rewards.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(
      ...sectionDisplay(markup.bold("🏆 Rewards"), rewards),
    );
  }

  if (energyBefore !== energyAfter) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `⚡ ${markup.bold("Energy")}\n${String(energyBefore)} → ${String(energyAfter)}`,
      ),
    );
  }

  const { progression } = result;

  if (progression.questsCompleted.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(
      ...sectionDisplay(
        markup.bold("📋 Daily Quests"),
        progression.questsCompleted.map(
          (quest) =>
            `✅ ${quest.emoji ?? "📋"} ${quest.title ?? quest.quest_key}`,
        ),
      ),
    );
  }

  if (progression.discoveries.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(
      ...sectionDisplay(
        markup.bold("📔 Journal"),
        progression.discoveries.map(
          (discovery) => `✨ ${discovery.emoji} ${discovery.name}`,
        ),
      ),
    );
  }

  if (progression.achievements.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(
      ...sectionDisplay(
        markup.bold("🏅 Achievements"),
        progression.achievements.map(
          (achievement) =>
            `${achievement.emoji} ${achievement.name} · +${String(achievement.rewardCoins)} coins`,
        ),
      ),
    );
  }

  if (summary.levelUp) {
    const { currentLevel, remainingXp, nextLevelXp } = summary.levelUp;
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          markup.bold("🎉 Level Up!"),
          `You've become ${markup.bold(
            `${getTitle(currentLevel)} (Level ${String(currentLevel)})`,
          )}!`,
          markup.italic(
            `Progress to the next level: ${String(remainingXp)}/${String(nextLevelXp)} XP`,
          ),
        ].join("\n"),
      ),
    );
  }

  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(markup.italic(location.returnMessage)),
  );

  if (energyAfter >= MIN_PLAY_ENERGY) {
    container.addActionRowComponents(
      buildLocationSelectRow(
        getUnlockedLocations(result.player.level),
        "Wander again",
      ),
    );
  }

  return { components: [container], flags: IS_COMPONENTS_V2 };
}

export function buildPlayNoticePayload(content: string): PlayComponentPayload {
  return {
    components: [
      new ContainerBuilder()
        .setAccentColor(CAMPFIRE_ORANGE)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content)),
    ],
    flags: IS_COMPONENTS_V2,
  };
}
