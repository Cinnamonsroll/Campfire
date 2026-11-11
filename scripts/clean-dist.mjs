import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const output = resolve(projectRoot, "dist");
if (dirname(output) !== projectRoot || output === projectRoot) {
  throw new Error("Refusing to clean outside the project output directory");
}
await rm(output, { recursive: true, force: true });
