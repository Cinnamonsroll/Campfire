import { pool } from "#src/database/client.js";
import type { Db } from "#src/database/db.js";
import { logger } from "#src/utils/logger.js";

export async function withTransaction<T>(
  fn: (db: Db) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  client.on("error", (err) => {
    logger.error(err, "Unexpected PostgreSQL transaction client error");
  });
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
