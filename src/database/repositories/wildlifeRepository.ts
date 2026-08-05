import { pool } from "../client.js";
import type { Db } from "../db.js";

interface WildlifeAlbumEntry {
  id: string;
  player_id: string;
  species_key: string;
  location_key: string;
  best_rank: number;
  best_quality: string;
  first_photographed_at: Date;
}

export async function upsertPhoto(
  playerId: string,
  speciesKey: string,
  locationKey: string,
  qualityRank: number,
  quality: string,
  db: Db = pool,
): Promise<WildlifeAlbumEntry> {
  const result = await db.query<WildlifeAlbumEntry>(
    `INSERT INTO wildlife_album
       (player_id, species_key, location_key, best_rank, best_quality)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (player_id, species_key)
     DO UPDATE SET
       best_rank = GREATEST(wildlife_album.best_rank, EXCLUDED.best_rank),
       best_quality = CASE
         WHEN EXCLUDED.best_rank > wildlife_album.best_rank
           THEN EXCLUDED.best_quality
         ELSE wildlife_album.best_quality
       END,
       location_key = EXCLUDED.location_key,
       first_photographed_at = LEAST(
         wildlife_album.first_photographed_at,
         EXCLUDED.first_photographed_at
       )
     RETURNING *`,
    [playerId, speciesKey, locationKey, qualityRank, quality],
  );
  return result.rows[0];
}
