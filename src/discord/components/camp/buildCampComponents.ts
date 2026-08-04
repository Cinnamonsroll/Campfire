import {
  ActionRowBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  type APIMessageTopLevelComponent,
  type JSONEncodable,
} from "discord.js";
import { IS_COMPONENTS_V2 } from "#src/discord/constants.js";
import { CAMP_UPGRADE_SELECT_ID } from "#src/discord/customIds.js";
import { CAMPFIRE_ORANGE, CAMPFIRE_RED } from "#src/embeds/base.js";
import { CAMP_UPGRADES } from "#src/game/data/campUpgrades.js";
import { ITEMS } from "#src/game/data/items.js";
import type { PlayerCamp } from "#src/database/repositories/campRepository.js";
import {
  formatUpgradeCost,
  getBuildingLevel,
} from "#src/game/services/campService.js";
import {
  type UpgradeError,
  type UpgradeResult,
} from "#src/game/services/upgradeService.js";
import type { AchievementDefinition } from "#src/game/types.js";
import { markup } from "#src/utils/markup.js";

const CAMP_CARD_ATTACHMENT = "attachment://campsite_card.png";

export interface CampsiteComponentPayload {
  readonly components: JSONEncodable<APIMessageTopLevelComponent>[];
  readonly flags: number;
}

export function buildUpgradeSelect(
  camp: PlayerCamp,
): ActionRowBuilder<StringSelectMenuBuilder> {
  const options = Object.values(CAMP_UPGRADES).map((building) => {
    const currentLevel = getBuildingLevel(camp, building.key);
    const maxed = currentLevel >= building.maxLevel;
    const next = building.levels[currentLevel - 1];

    const label = maxed
      ? `${building.name} — Max Level`
      : `${building.name} · Next: ${String(currentLevel + 1)}`;
    const description = maxed
      ? building.description
      : `${next.effect} · ${formatUpgradeCost(next.costCoins, next.costItems)}`;

    return new StringSelectMenuOptionBuilder()
      .setLabel(label)
      .setValue(building.key)
      .setEmoji(building.emoji)
      .setDescription(description);
  });

  return new ActionRowBuilder<StringSelectMenuBuilder>({
    components: [
      new StringSelectMenuBuilder()
        .setCustomId(CAMP_UPGRADE_SELECT_ID)
        .setPlaceholder("Upgrade a building")
        .addOptions(options),
    ],
  });
}

export function buildCampsiteContainer(
  characterName: string,
  camp: PlayerCamp | null,
): ContainerBuilder {
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`🏕 ${markup.bold(characterName)}`),
  );

  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder()
        .setURL(CAMP_CARD_ATTACHMENT)
        .setDescription("A view of the campsite"),
    ),
  );

  if (camp) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(buildUpgradeSelect(camp));
  }

  return container;
}

export function buildUpgradeErrorContainer(
  error: UpgradeError,
  coins: number,
): ContainerBuilder {
  const { building } = error;

  let lines: readonly string[];
  switch (error.kind) {
    case "maxed":
      lines = [
        `${building.emoji} ${markup.bold(building.name)} is already at its max level (${String(building.maxLevel)}).`,
      ];
      break;
    case "coins":
      lines = [
        `You need ${markup.inline(`${String(error.costCoins)} coins`)} for this upgrade, but you only have ${markup.inline(`${String(coins)} coins`)}.`,
        markup.italic("Earn more coins or gather supplies, then try again."),
      ];
      break;
    case "items":
      lines = [
        "You're missing a few supplies for this upgrade:",
        ...error.missingItems.map(
          (cost) =>
            `${ITEMS[cost.itemKey].emoji} ${markup.bold(ITEMS[cost.itemKey].name)} ×${String(cost.quantity)}`,
        ),
      ];
      break;
  }

  return new ContainerBuilder()
    .setAccentColor(CAMPFIRE_RED)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `⚠️ ${markup.bold(`Couldn't upgrade ${building.emoji} ${building.name}`)}`,
      ),
      new TextDisplayBuilder().setContent(lines.join("\n")),
    );
}

export function buildUpgradeResultContainer(
  result: UpgradeResult,
  coinsRemaining: number,
  achievements: readonly AchievementDefinition[] = [],
): ContainerBuilder {
  const { building, currentLevel, nextLevel, effect } = result;

  const lines = [
    `${building.emoji} Level ${String(currentLevel)} → ${markup.bold(String(nextLevel))}`,
    `✨ ${effect}`,
    `🪙 ${String(coinsRemaining)} coins remaining`,
  ];

  if (achievements.length > 0) {
    lines.push(
      "",
      markup.bold("🏅 Achievement"),
      ...achievements.map(
        (achievement) =>
          `${achievement.emoji} ${achievement.name} — +${String(achievement.rewardCoins)} coins`,
      ),
    );
  }

  return new ContainerBuilder()
    .setAccentColor(CAMPFIRE_ORANGE)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `✅ ${markup.bold(`${building.emoji} ${building.name} upgraded!`)}`,
      ),
      new TextDisplayBuilder().setContent(lines.join("\n")),
    );
}

export function campsitePayload(
  characterName: string,
  camp: PlayerCamp | null,
  extra?: ContainerBuilder | null,
): CampsiteComponentPayload {
  const components: JSONEncodable<APIMessageTopLevelComponent>[] = [
    buildCampsiteContainer(characterName, camp),
  ];
  if (extra) {
    components.push(extra);
  }
  return { components, flags: IS_COMPONENTS_V2 };
}

export function buildCampsiteNoticePayload(
  content: string,
): CampsiteComponentPayload {
  return {
    components: [
      new ContainerBuilder()
        .setAccentColor(CAMPFIRE_ORANGE)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content)),
    ],
    flags: IS_COMPONENTS_V2,
  };
}
