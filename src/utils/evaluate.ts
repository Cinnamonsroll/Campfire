/* Owner-authorized dynamic execution is the purpose of this module. */
/* eslint-disable @typescript-eslint/no-implied-eval */
import { Script } from "node:vm";
import { inspect } from "node:util";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";
import type {
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
} from "discord.js";
export interface EvaluationContext {
  interaction: ChatInputCommandInteraction | ModalSubmitInteraction;
}

export function parseCode(
  input: string,
  language = "js",
): { code: string; language: string } {
  const match = /^\s*```([^\n`]*)\r?\n([\s\S]*?)\r?\n?```\s*$/.exec(input);
  return {
    code: match ? match[2] : input,
    language: (match?.[1].trim() ? match[1].trim() : language).toLowerCase(),
  };
}

export async function evaluateLocal(
  code: string,
  language: string,
  ctx: EvaluationContext,
  depth: number,
): Promise<{ output: string; type: string }> {
  const logs: string[] = [];
  let logSize = 0;
  const log = (...args: unknown[]): void => {
    if (logSize >= 100_000) return;
    const line = args
      .map((value) =>
        typeof value === "string"
          ? value
          : inspect(value, { depth, maxArrayLength: 100 }),
      )
      .join(" ")
      .slice(0, 100_000 - logSize);
    logs.push(line);
    logSize += line.length;
  };
  const source =
    language === "ts" || language === "typescript"
      ? transpileModule(code, {
          compilerOptions: {
            target: ScriptTarget.ES2022,
            module: ModuleKind.ESNext,
          },
        }).outputText
      : code;
  // Direct eval preserves completion values; the async fallback permits await/return.
  let body: string;
  try {
    new Script(source);
    body = `return await eval(${JSON.stringify(source)});`;
  } catch {
    try {
      new Function(`return (async () => (${source}))();`);
      body = `return await (async () => (${source}))();`;
    } catch {
      body = `return await (async () => {${source}\n})();`;
    }
  }
  const run = new Function(
    "ctx",
    "interaction",
    "client",
    "console",
    "inspect",
    `return (async () => {${body}\n})();`,
  ) as (
    ctx: EvaluationContext,
    interaction: EvaluationContext["interaction"],
    client: EvaluationContext["interaction"]["client"],
    console: object,
    inspectFn: typeof inspect,
  ) => Promise<unknown>;
  const value = await run(
    ctx,
    ctx.interaction,
    ctx.interaction.client,
    { log, info: log, warn: log, error: log, debug: log, dir: log },
    inspect,
  );
  const result =
    typeof value === "string"
      ? value
      : inspect(value, {
          depth,
          maxArrayLength: 1000,
          maxStringLength: 100_000,
        });
  return {
    output: [...logs, result].join("\n"),
    type:
      value === null ? "null" : Array.isArray(value) ? "Array" : typeof value,
  };
}
