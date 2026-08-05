import { pool } from "../client.js";
import type { Db } from "../db.js";

export interface QuestRow {
  id: string;
  quest_key: string;
  title: string | null;
  description: string | null;
  emoji: string | null;
  quest_type: string;
  target_key: string | null;
  target: number;
  reward_xp: number;
  reward_coins: number;
}

export interface PlayerQuest {
  id: string;
  player_id: string;
  quest_id: string;
  completed: boolean;
  progress: number;
  claimed: boolean;
  date: string;
}

export interface DailyQuestRow extends PlayerQuest, QuestRow {}

export interface QuestDefinitionInput {
  quest_key: string;
  title: string;
  description: string;
  emoji: string;
  quest_type: string;
  target_key: string | null;
  target: number;
  reward_xp: number;
  reward_coins: number;
}

export async function upsertQuests(
  quests: QuestDefinitionInput[],
  db: Db = pool,
): Promise<QuestRow[]> {
  if (quests.length === 0) return [];

  const columns = `(quest_key, title, description, emoji, quest_type,
                   target_key, target, reward_xp, reward_coins)`;
  const placeholders: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const quest of quests) {
    placeholders.push(
      `($${String(paramIndex)}, $${String(paramIndex + 1)}, $${String(paramIndex + 2)}, $${String(paramIndex + 3)}, $${String(paramIndex + 4)}, $${String(paramIndex + 5)}, $${String(paramIndex + 6)}, $${String(paramIndex + 7)}, $${String(paramIndex + 8)})`,
    );
    values.push(
      quest.quest_key,
      quest.title,
      quest.description,
      quest.emoji,
      quest.quest_type,
      quest.target_key,
      quest.target,
      quest.reward_xp,
      quest.reward_coins,
    );
    paramIndex += 9;
  }

  const result = await db.query<QuestRow>(
    `INSERT INTO quests ${columns}
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (quest_key) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       emoji = EXCLUDED.emoji,
       quest_type = EXCLUDED.quest_type,
       target_key = EXCLUDED.target_key,
       target = EXCLUDED.target,
       reward_xp = EXCLUDED.reward_xp,
       reward_coins = EXCLUDED.reward_coins
     RETURNING *`,
    values,
  );
  return result.rows;
}

export async function ensurePlayerQuestRows(
  playerId: string,
  questIds: string[],
  date: string,
  db: Db = pool,
): Promise<void> {
  if (questIds.length === 0) return;

  await db.query(
    `INSERT INTO player_quests (player_id, quest_id, date)
     SELECT $1, unnest($2::uuid[]), $3
     ON CONFLICT (player_id, quest_id, date) DO NOTHING`,
    [playerId, questIds, date],
  );
}

export async function findDailyByPlayerId(
  playerId: string,
  date: string,
  db: Db = pool,
): Promise<DailyQuestRow[]> {
  const result = await db.query<DailyQuestRow>(
    `SELECT pq.*, q.quest_key, q.title, q.description, q.emoji,
            q.quest_type, q.target_key, q.target, q.reward_xp, q.reward_coins
     FROM player_quests pq
     JOIN quests q ON q.id = pq.quest_id
     WHERE pq.player_id = $1 AND pq.date = $2
     ORDER BY q.quest_key ASC`,
    [playerId, date],
  );
  return result.rows;
}

export async function findById(
  id: string,
  db: Db = pool,
): Promise<PlayerQuest | null> {
  const result = await db.query<PlayerQuest>(
    `SELECT * FROM player_quests WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function updateProgress(
  id: string,
  progress: number,
  completed: boolean,
  db: Db = pool,
): Promise<PlayerQuest | null> {
  const result = await db.query<PlayerQuest>(
    `UPDATE player_quests
     SET progress = $1, completed = $2
     WHERE id = $3
     RETURNING *`,
    [progress, completed, id],
  );
  return result.rows[0] ?? null;
}

export async function setClaimed(
  id: string,
  db: Db = pool,
): Promise<PlayerQuest | null> {
  const result = await db.query<PlayerQuest>(
    `UPDATE player_quests
     SET claimed = TRUE
     WHERE id = $1
     RETURNING *`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function countCompletedByPlayerId(
  playerId: string,
  db: Db = pool,
): Promise<number> {
  const result = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM player_quests
     WHERE player_id = $1 AND completed = TRUE`,
    [playerId],
  );
  return Number(result.rows[0]?.count ?? 0);
}
