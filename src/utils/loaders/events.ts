import type { Event } from "#src/types/index.js";
import {
  readdirSync,
  join,
  pathToFileURL,
  logger,
  loaderDirname,
} from "./index.js";

const __dirname = loaderDirname(import.meta);

export async function loadEvents(): Promise<Event[]> {
  const eventsPath = join(__dirname, "..", "..", "events");
  const files = readdirSync(eventsPath).filter(
    (f) => f.endsWith(".ts") || f.endsWith(".js"),
  );

  const modules = await Promise.all(
    files.map(async (file) => {
      try {
        const filePath = join(eventsPath, file);
        const mod = (await import(pathToFileURL(filePath).href)) as {
          default: Event;
        };
        return mod.default;
      } catch (error) {
        logger.error({ file, error }, "Failed to load event");
        return null;
      }
    }),
  );

  return modules.filter(
    (e): e is Event => e !== null && "name" in e && "execute" in e,
  );
}
