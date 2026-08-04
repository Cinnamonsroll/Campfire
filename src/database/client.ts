import pg from "pg";
import { env } from "#src/config/index.js";
import { logger } from "#src/utils/logger.js";

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
});

pool.on("error", (err) => {
  logger.error(err, "Unexpected PostgreSQL pool error");
});
