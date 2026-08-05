const FONT = "Segoe UI";

export function font(
  size: number,
  weight: "bold" | "normal" = "normal",
): string {
  return `${weight === "bold" ? "bold " : ""}${String(size)}px ${FONT}`;
}
