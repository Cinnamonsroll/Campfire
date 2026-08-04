import { pool } from "#/database/client.js";
import type { Db } from "#/database/db.js";
import {
  addUnlocked,
  ensureAchievementsByKeys,
  findUnlockedKeysByPlayerId,
} from "#/database/repositories/achievementRepository.js";
import { findByPlayerId as findCamp } from "#/database/repositories/campRepository.js";
import { findPlayerDiscoveries } from "#/database/repositories/discoveryRepository.js";
import type { Player } from "#/database/repositories/playerRepository.js";
import { countCompletedByPlayerId } from "#/database/repositories/questRepository.js";
import {
  ACHIEVEMENTS,
  BEACH_ITEM_KEYS,
  JOURNAL_ITEM_KEYS,
} from "#/game/data/achievements.js";
import type { AchievementDefinition } from "#/game/types.js";

interface AchievementCounts {
  discoveredKeys: Set<string>;
  questsCompleted: number;
  totalUpgrades: number;
}

function journalSet(definition: AchievementDefinition): readonly string[] {
  if (definition.itemKeys) return definition.itemKeys;
  return definition.key === "complete_beach_journal"
    ? BEACH_ITEM_KEYS
    : JOURNAL_ITEM_KEYS;
}

async function gatherCounts(
  player: Player,
  db: Db,
): Promise<AchievementCounts> {
  const [discoveries, questsCompleted, camp] = await Promise.all([
    findPlayerDiscoveries(player.id, db),
    countCompletedByPlayerId(player.id, db),
    findCamp(player.id, db),
  ]);

  return {
    discoveredKeys: new Set(
      discoveries.map((discovery) => discovery.discovery_key),
    ),
    questsCompleted,
    totalUpgrades: camp
      ? camp.tent_level + camp.campfire_level + camp.storage_level - 3
      : 0,
  };
}

function conditionMet(
  definition: AchievementDefinition,
  player: Player,
  counts: AchievementCounts,
): boolean {
  switch (definition.type) {
    case "level":
      return player.level >= definition.target;
    case "adventure":
      return player.total_adventures >= definition.target;
    case "items_collected":
      return player.items_collected >= definition.target;
    case "discovery":
      return counts.discoveredKeys.size >= definition.target;
    case "quest":
      return counts.questsCompleted >= definition.target;
    case "upgrade":
      return counts.totalUpgrades >= definition.target;
    case "journal": {
      const keys = journalSet(definition);
      const discovered = keys.filter((key) => counts.discoveredKeys.has(key));
      return discovered.length >= keys.length;
    }
    default:
      return false;
  }
}

export async function evaluateAchievements(
  player: Player,
  db: Db = pool,
): Promise<AchievementDefinition[]> {
  const unlockedKeys = new Set(await findUnlockedKeysByPlayerId(player.id, db));
  const pending = Object.values(ACHIEVEMENTS).filter(
    (definition) => !unlockedKeys.has(definition.key),
  );
  if (pending.length === 0) return [];

  const counts = await gatherCounts(player, db);
  const nowUnlocked = pending.filter((definition) =>
    conditionMet(definition, player, counts),
  );
  if (nowUnlocked.length === 0) return [];

  const rows = await ensureAchievementsByKeys(
    nowUnlocked.map((definition) => definition.key),
    db,
  );
  const idByKey = new Map(rows.map((row) => [row.achievement_key, row.id]));
  const ids = nowUnlocked
    .map((definition) => idByKey.get(definition.key))
    .filter((id): id is string => id !== undefined);

  await addUnlocked(player.id, ids, db);
  return nowUnlocked;
}
