import { campfireEmbed } from "./base.js";
import { markup } from "../utils/markup.js";
import type { UpgradeResult } from "../game/services/upgradeService.js";
import type { AchievementDefinition } from "../game/types.js";

export function upgradeResultEmbed(
  result: UpgradeResult,
  coinsRemaining: number,
  achievements: readonly AchievementDefinition[] = [],
): ReturnType<typeof campfireEmbed> {
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

  return campfireEmbed()
    .setTitle(`${building.emoji} ${building.name} upgraded!`)
    .setDescription(lines.join("\n"));
}
