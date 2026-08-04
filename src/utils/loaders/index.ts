import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../logger.js";

export { readdirSync, join, dirname, fileURLToPath, logger };
export { pathToFileURL } from "node:url";
export { existsSync } from "node:fs";

export function loaderDirname(meta: ImportMeta): string {
  return dirname(fileURLToPath(meta.url));
}
