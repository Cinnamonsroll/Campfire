import { Vanta } from "@vanta-dev/node";
import { logger } from "./logger.js";

const apiKey = process.env.VANTA_API_KEY;

function disabledVanta(): Vanta {
  const noop = () => Promise.resolve();
  return {
    track: noop,
    identify: noop,
    group: noop,
    measure: noop,
    increment: noop,
    decrement: noop,
    error: noop,
    shutdown: () => Promise.resolve(),
  } as unknown as Vanta;
}

export const vanta = apiKey
  ? new Vanta({
      apiKey,
      onDeliveryError: (error) => {
        logger.error(error, "Failed to deliver events to Vanta");
      },
    })
  : disabledVanta();

if (!apiKey) {
  logger.warn(
    "VANTA_API_KEY is not set; Vanta event tracking is disabled",
  );
}

export function reportError(error: unknown): void {
  void vanta.error(error instanceof Error ? error : String(error));
}

export async function flushVanta(): Promise<void> {
  await (vanta as unknown as { flush: () => Promise<boolean> }).flush();
}
