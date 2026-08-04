import { pool } from "../database/client.js";
import type { Db } from "../database/db.js";
import type { DailyQuestRow } from "../database/repositories/questRepository.js";
import type { Player } from "../database/repositories/playerRepository.js";
import {
  grantRewards,
  type RewardSummary,
} from "../game/rewards/rewardService.js";
import { evaluateAchievements } from "../game/services/achievementService.js";
import {
  recordDailyProgress,
  type ProgressionEvents,
} from "../game/services/dailyQuestService.js";
import { recordDiscoveries } from "../game/services/journal/index.js";
import type { AchievementDefinition, ItemDefinition } from "../game/types.js";

export interface ProgressionResult {
  questsCompleted: DailyQuestRow[];
  discoveries: ItemDefinition[];
  achievements: AchievementDefinition[];
  achievementSummary: RewardSummary | null;
}

export async function evaluateAndAwardAchievements(
  player: Player,
  db: Db = pool,
): Promise<{
  achievements: AchievementDefinition[];
  summary: RewardSummary | null;
}> {
  const achievements = await evaluateAchievements(player, db);

  const rewardCoins = achievements.reduce(
    (sum, definition) => sum + definition.rewardCoins,
    0,
  );
  if (rewardCoins <= 0) return { achievements, summary: null };

  const { summary } = await grantRewards({ player, coins: rewardCoins }, db);
  return { achievements, summary };
}

export async function applyProgression(
  player: Player,
  discordId: string,
  events: ProgressionEvents,
  db: Db = pool,
): Promise<ProgressionResult> {
  const questsCompleted = await recordDailyProgress(
    player.id,
    discordId,
    events,
    db,
  );
  const discoveries = await recordDiscoveries(
    player.id,
    events.itemsGranted ?? [],
    db,
  );
  const { achievements, summary: achievementSummary } =
    await evaluateAndAwardAchievements(player, db);

  return {
    questsCompleted,
    discoveries,
    achievements,
    achievementSummary,
  };
}
