import { pool } from "#src/database/client.js";
import type { Db } from "#src/database/db.js";

export interface DiscoveryRow {
  id: string;
  discovery_key: string;
}

export interface PlayerDiscovery {
  discovery_key: string;
  found_at: Date;
}

export async function ensureDiscoveryByKeys(
  discoveryKeys: string[],
  db: Db = pool,
): Promise<DiscoveryRow[]> {
  if (discoveryKeys.length === 0) return [];
  await db.query(
    `INSERT INTO discoveries (discovery_key)
     SELECT unnest($1::text[])
     ON CONFLICT (discovery_key) DO NOTHING`,
    [discoveryKeys],
  );
  const result = await db.query<DiscoveryRow>(
    `SELECT * FROM discoveries WHERE discovery_key = ANY($1)`,
    [discoveryKeys],
  );
  return result.rows;
}

export async function findPlayerDiscoveries(
  playerId: string,
  db: Db = pool,
): Promise<PlayerDiscovery[]> {
  const result = await db.query<PlayerDiscovery>(
    `SELECT d.discovery_key, pd.found_at
     FROM player_discoveries pd
     JOIN discoveries d ON d.id = pd.discovery_id
     WHERE pd.player_id = $1
     ORDER BY pd.found_at ASC`,
    [playerId],
  );
  return result.rows;
}

export async function addDiscoveries(
  playerId: string,
  discoveryIds: string[],
  db: Db = pool,
): Promise<string[]> {
  if (discoveryIds.length === 0) return [];
  const result = await db.query<{ discovery_id: string }>(
    `INSERT INTO player_discoveries (player_id, discovery_id)
     SELECT $1, unnest($2::uuid[])
     ON CONFLICT (player_id, discovery_id) DO NOTHING
     RETURNING discovery_id`,
    [playerId, discoveryIds],
  );
  return result.rows.map((row) => row.discovery_id);
}
