import {
  readdirSync,
  existsSync,
  join,
  pathToFileURL,
  logger,
  loaderDirname,
} from "./index.js";

const __dirname = loaderDirname(import.meta);

export async function loadInteractionHandlers<T>(
  handlersDir: string,
): Promise<Map<string, T>> {
  const handlers = new Map<string, T>();
  const entries = readdirSync(handlersDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const dirPath = join(handlersDir, entry.name);
    const tsPath = join(dirPath, "index.ts");
    const jsPath = join(dirPath, "index.js");
    const indexPath = existsSync(tsPath)
      ? tsPath
      : existsSync(jsPath)
        ? jsPath
        : null;

    if (!indexPath) continue;

    try {
      const mod: unknown = await import(pathToFileURL(indexPath).href);

      let exported: Map<string, T> | undefined;

      if (mod instanceof Map) {
        exported = mod;
      } else if (mod && typeof mod === "object" && "default" in mod) {
        const defaultExport: unknown = (mod as Record<"default", unknown>)
          .default;
        if (defaultExport instanceof Map) {
          exported = defaultExport;
        }
      }

      if (exported) {
        for (const [key, handler] of exported) {
          handlers.set(key, handler);
        }
      }
    } catch (error) {
      logger.error(
        { dir: entry.name, error },
        "Failed to load interaction handlers",
      );
    }
  }

  return handlers;
}

export function interactionsDir(): string {
  return join(__dirname, "..", "..", "interactions");
}
