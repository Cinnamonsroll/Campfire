const STATE_SEPARATOR = "|";

export function encodeComponentState(
  segments: readonly (string | number)[],
): string {
  return segments.map(String).join(STATE_SEPARATOR);
}
