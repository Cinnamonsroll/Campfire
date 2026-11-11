import pg from "pg";
import { env } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { reportError } from "../utils/vanta.js";

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
});

pool.on("error", (err) => {
  logger.error(err, "Unexpected PostgreSQL pool error");
  reportError(err);
});
