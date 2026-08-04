import { pool } from "#/database/client.js";
import type { Db } from "#/database/db.js";

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

  for (const quest of quests) {
    await db.query(
      `INSERT INTO quests (quest_key, title, description, emoji, quest_type,
                           target_key, target, reward_xp, reward_coins)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (quest_key) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         emoji = EXCLUDED.emoji,
         quest_type = EXCLUDED.quest_type,
         target_key = EXCLUDED.target_key,
         target = EXCLUDED.target,
         reward_xp = EXCLUDED.reward_xp,
         reward_coins = EXCLUDED.reward_coins`,
      [
        quest.quest_key,
        quest.title,
        quest.description,
        quest.emoji,
        quest.quest_type,
        quest.target_key,
        quest.target,
        quest.reward_xp,
        quest.reward_coins,
      ],
    );
  }

  const result = await db.query<QuestRow>(
    `SELECT * FROM quests WHERE quest_key = ANY($1)`,
    [quests.map((quest) => quest.quest_key)],
  );
  return result.rows;
}

export async function ensurePlayerQuestRow(
  playerId: string,
  questId: string,
  date: string,
  db: Db = pool,
): Promise<PlayerQuest> {
  const result = await db.query<PlayerQuest>(
    `INSERT INTO player_quests (player_id, quest_id, date)
     VALUES ($1, $2, $3)
     ON CONFLICT (player_id, quest_id, date) DO NOTHING
     RETURNING *`,
    [playerId, questId, date],
  );
  if (result.rows[0]) return result.rows[0];

  const existing = await findPlayerQuest(playerId, questId, date, db);
  if (existing) return existing;

  throw new Error(`Unable to create player quest row for ${questId}`);
}

export async function findPlayerQuest(
  playerId: string,
  questId: string,
  date: string,
  db: Db = pool,
): Promise<PlayerQuest | null> {
  const result = await db.query<PlayerQuest>(
    `SELECT * FROM player_quests
     WHERE player_id = $1 AND quest_id = $2 AND date = $3`,
    [playerId, questId, date],
  );
  return result.rows[0] ?? null;
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
