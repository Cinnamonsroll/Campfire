import { z } from "zod";

const runtimeSchema = z.object({
  language: z.string(),
  version: z.string(),
  aliases: z.array(z.string()),
});
const stageSchema = z.object({
  output: z.string().default(""),
  code: z.number().nullable().optional(),
  signal: z.string().nullable().optional(),
});
const responseSchema = z.object({
  run: stageSchema.optional(),
  compile: stageSchema.optional(),
});
export interface ExecutionResult {
  console: string;
  compiler?: string;
  error: boolean;
}

export class PistonClient {
  private runtimes?: {
    expires: number;
    value: z.infer<typeof runtimeSchema>[];
  };
  constructor(
    private readonly baseUrl = process.env.PISTON_URL ??
      "https://emkc.org/api/v2/piston",
  ) {}

  private async request(path: string, body?: unknown): Promise<unknown> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    const data: unknown = await response.json();
    if (!response.ok) {
      const message = z.object({ message: z.string() }).safeParse(data);
      throw new Error(
        message.success
          ? message.data.message
          : `Piston request failed (${String(response.status)})`,
      );
    }
    return data;
  }

  async getRuntimes(): Promise<z.infer<typeof runtimeSchema>[]> {
    if (this.runtimes && this.runtimes.expires > Date.now())
      return this.runtimes.value;
    const value = z.array(runtimeSchema).parse(await this.request("runtimes"));
    this.runtimes = { value, expires: Date.now() + 3_600_000 };
    return value;
  }

  async execute(code: string, language: string): Promise<ExecutionResult> {
    const name = language.toLowerCase();
    const runtime = (await this.getRuntimes()).find(
      (r) => r.language === name || r.aliases.includes(name),
    );
    if (!runtime) throw new Error(`Language ${language} not found`);
    const result = responseSchema.parse(
      await this.request("execute", {
        language: runtime.language,
        version: runtime.version,
        files: [{ content: code }],
        compile_timeout: 10_000,
        run_timeout: 3_000,
      }),
    );
    if (!result.run && !result.compile)
      throw new Error("Piston returned no execution output");
    const failed = (stage: z.infer<typeof stageSchema> | undefined): boolean =>
      !!stage && (!!stage.signal || (stage.code != null && stage.code !== 0));
    return {
      console: result.run?.output ?? "",
      compiler: result.compile?.output,
      error: failed(result.compile) || failed(result.run),
    };
  }
}
