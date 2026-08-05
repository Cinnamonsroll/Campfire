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
import { CAMPFIRE_ORANGE } from "../../../embeds/base.js";
import { rewardLines } from "../../../game/rewards/format.js";
import { getTitle } from "../../../game/utils/titles.js";
import type { RewardSummary } from "../../../game/rewards/rewardService.js";
import type { ProgressionResult } from "../../../game/services/progressionService.js";
import type { LocationDefinition } from "../../../game/types.js";
import { markup } from "../../../utils/markup.js";

const MAX_LINES_PER_TEXT_DISPLAY = 15;

export interface GameComponentPayload {
  readonly components: JSONEncodable<APIMessageTopLevelComponent>[];
  readonly flags: number;
}

export function buildGameNoticePayload(
  content: string,
): GameComponentPayload {
  return {
    components: [
      new ContainerBuilder()
        .setAccentColor(CAMPFIRE_ORANGE)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content)),
    ],
    flags: IS_COMPONENTS_V2,
  };
}

function sectionDisplay(
  header: string,
  lines: readonly string[],
): TextDisplayBuilder[] {
  if (lines.length === 0) return [];

  const displays: TextDisplayBuilder[] = [];
  displays.push(
    new TextDisplayBuilder().setContent(
      `${header}\n${lines.slice(0, MAX_LINES_PER_TEXT_DISPLAY).join("\n")}`,
    ),
  );
  for (let i = MAX_LINES_PER_TEXT_DISPLAY; i < lines.length; i += MAX_LINES_PER_TEXT_DISPLAY) {
    displays.push(
      new TextDisplayBuilder().setContent(
        lines.slice(i, i + MAX_LINES_PER_TEXT_DISPLAY).join("\n"),
      ),
    );
  }
  return displays;
}

export function buildLocationSelectRow(
  customId: string,
  locations: readonly LocationDefinition[],
  placeholder: string,
): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>({
    components: [
      new StringSelectMenuBuilder()
        .setCustomId(customId)
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

interface ActivityResultDisplay {
  header: string;
  story: readonly string[];
  summary: RewardSummary;
  energyBefore: number;
  energyAfter: number;
  progression: ProgressionResult;
  footer?: string;
}

export function buildActivityResultPayload(
  display: ActivityResultDisplay,
): GameComponentPayload {
  const {
    header,
    story,
    summary,
    energyBefore,
    energyAfter,
    progression,
    footer,
  } = display;

  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(header),
    new TextDisplayBuilder().setContent(
      story.map((line) => `> ${line}`).join("\n"),
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

  if (progression.questsCompleted.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(
      ...sectionDisplay(
        markup.bold("📋 Daily Quests"),
        progression.questsCompleted.map(
          (quest) => `✅ ${quest.emoji ?? "📋"} ${quest.title ?? quest.quest_key}`,
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

  if (footer) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(markup.italic(footer)),
    );
  }

  return { components: [container], flags: IS_COMPONENTS_V2 };
}
