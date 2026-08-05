import { pool } from "../../database/client.js";
import { Db } from "../../database/db.js";
import { findByPlayerId as findCamp } from "../../database/repositories/campRepository.js";
import { Player } from "../../database/repositories/playerRepository.js";
import { DailyQuestRow, upsertQuests, ensurePlayerQuestRows, findDailyByPlayerId, updateProgress, PlayerQuest, setClaimed } from "../../database/repositories/questRepository.js";
import { addStats } from "../../database/repositories/statRepository.js";
import { withTransaction } from "../../database/transaction.js";
import { redis } from "../../redis/client.js";
import { QUESTS } from "../data/quests.js";
import { RewardSummary, grantRewards } from "../rewards/rewardService.js";
import { secondsUntilTomorrow, todayKey } from "../utils/date.js";
import { getXpMultiplier, getBuildingLevel } from "./campService.js";

export interface ProgressionEvents {
  locationKey?: string;
  itemsGranted?: { itemKey: string; quantity: number }[];
  xpGained?: number;
  adventures?: number;
}

interface DailyQuestCache {
  date: string;
  keys: string[];
}

const DAILY_COUNT = 3;
const DAILY_CACHE_PREFIX = "daily_quests:";

function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < str.length; index++) {
    hash ^= str.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function pickDailyKeys(discordId: string, date: string): string[] {
  const questKeys = Object.keys(QUESTS);
  let seed = fnv1a(`${discordId}:${date}`);
  const chosen: string[] = [];
  const seen = new Set<string>();

  while (chosen.length < DAILY_COUNT) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const key = questKeys[seed % questKeys.length];
    if (key && !seen.has(key)) {
      seen.add(key);
      chosen.push(key);
    }
  }

  return chosen;
}

async function getDailyQuestKeys(
  discordId: string,
  date: string,
): Promise<string[]> {
  const cacheKey = `${DAILY_CACHE_PREFIX}${discordId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as DailyQuestCache;
      if (
        parsed.date === date &&
        Array.isArray(parsed.keys) &&
        parsed.keys.length === DAILY_COUNT
      ) {
        return parsed.keys;
      }
    }
  } catch {
    // ignore corrupt cache and regenerate below
  }

  const keys = pickDailyKeys(discordId, date);
  const cache: DailyQuestCache = { date, keys };
  await redis.set(cacheKey, JSON.stringify(cache), {
    EX: secondsUntilTomorrow(),
  });
  return keys;
}

export async function getDailyQuests(
  playerId: string,
  discordId: string,
  db: Db = pool,
): Promise<DailyQuestRow[]> {
  const date = todayKey();
  const keys = await getDailyQuestKeys(discordId, date);

  const questRows = await upsertQuests(
    keys.map((key) => {
      const definition = QUESTS[key];
      return {
        quest_key: definition.key,
        title: definition.name,
        description: definition.description,
        emoji: definition.emoji,
        quest_type: definition.type,
        target_key: definition.targetKey,
        target: definition.target,
        reward_xp: definition.reward.xp,
        reward_coins: definition.reward.coins,
      };
    }),
    db,
  );
  const questIdByKey = new Map(
    questRows.map((quest) => [quest.quest_key, quest.id]),
  );

  const questIds = keys
    .map((key) => questIdByKey.get(key))
    .filter((id): id is string => id !== undefined);
  await ensurePlayerQuestRows(playerId, questIds, date, db);

  return findDailyByPlayerId(playerId, date, db);
}

function questDelta(
  quest: DailyQuestRow,
  events: ProgressionEvents,
): number {
  switch (quest.quest_type) {
    case "collect": {
      const items = events.itemsGranted ?? [];
      return items
        .filter((item) => item.itemKey === quest.target_key)
        .reduce((sum, item) => sum + item.quantity, 0);
    }
    case "visit":
      return events.locationKey != null &&
        events.locationKey === quest.target_key
        ? 1
        : 0;
    case "xp":
      return events.xpGained ?? 0;
    case "adventure":
      return events.adventures ?? 0;
    default:
      return 0;
  }
}

export async function recordDailyProgress(
  playerId: string,
  discordId: string,
  events: ProgressionEvents,
  db: Db = pool,
): Promise<DailyQuestRow[]> {
  const quests = await getDailyQuests(playerId, discordId, db);
  const completedNow: DailyQuestRow[] = [];

  for (const quest of quests) {
    if (quest.completed) continue;

    const delta = questDelta(quest, events);
    if (delta <= 0) continue;

    const newProgress = Math.min(quest.progress + delta, quest.target);
    const completed = newProgress >= quest.target;
    await updateProgress(quest.id, newProgress, completed, db);

    if (completed) {
      completedNow.push({ ...quest, progress: newProgress, completed: true });
    }
  }

  return completedNow;
}

interface DailyClaimResult {
  quest: PlayerQuest;
  summary: RewardSummary;
}

export async function claimDailyQuest(
  player: Player,
  quest: DailyQuestRow,
  db: Db = pool,
): Promise<DailyClaimResult> {
  const claim = async (tx: Db): Promise<DailyClaimResult> => {
    const camp = await findCamp(player.id, tx);
    const multiplier = getXpMultiplier(getBuildingLevel(camp, "campfire"));

    const { summary } = await grantRewards(
      {
        player,
        xp: quest.reward_xp,
        coins: quest.reward_coins,
        xpMultiplier: multiplier,
      },
      tx,
    );
    await setClaimed(quest.id, tx);
    await addStats(player, { quests_completed: 1 }, tx);

    return { quest, summary };
  };

  if (db === pool) {
    return withTransaction(claim);
  }
  return claim(db);
}
