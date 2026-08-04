import type { RewardSummary } from "./rewardService.js";

export function rewardLines(summary: RewardSummary): string[] {
  const lines: string[] = [];

  if (summary.xpGained > 0) {
    lines.push(`+${String(summary.xpGained)} XP`);
  }

  if (summary.coinsGained > 0) {
    lines.push(`+${String(summary.coinsGained)} coins`);
  }

  for (const item of summary.items) {
    const quantity = item.quantity > 1 ? ` ×${String(item.quantity)}` : "";
    lines.push(`+${item.emoji} ${item.name}${quantity}`);
  }

  return lines;
}
