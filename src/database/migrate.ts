import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "#/database/client.js";
import { logger } from "#/utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_TABLE = "_migrations";

async function ensureTrackingTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      name       TEXT PRIMARY KEY,
      run_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getRanMigrations(): Promise<Set<string>> {
  const result = await pool.query<{ name: string }>(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name`,
  );
  return new Set(result.rows.map((r) => r.name));
}

async function runMigration(name: string, sql: string): Promise<void> {
  await pool.query(sql);
  await pool.query(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`, [
    name,
  ]);
}

async function migrate(): Promise<void> {
  const migrationsDir = join(__dirname, "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    logger.info("No migrations found");
    await pool.end();
    return;
  }

  await ensureTrackingTable();
  const ran = await getRanMigrations();

  for (const file of files) {
    if (ran.has(file)) {
      logger.debug({ migration: file }, "Skipping already ran migration");
      continue;
    }

    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    logger.info({ migration: file }, "Running migration");

    try {
      await runMigration(file, sql);
    } catch (error) {
      logger.error({ migration: file, error }, "Migration failed");
      await pool.end();
      process.exit(1);
    }
  }

  logger.info("All migrations complete");
  await pool.end();
}

await migrate();
