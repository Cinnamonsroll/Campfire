import { campfireEmbed } from "./base.js";
import { markup } from "../utils/markup.js";
import { rewardLines } from "../game/rewards/format.js";
import type { RewardSummary } from "../game/rewards/rewardService.js";
import type { DailyQuestRow } from "../database/repositories/questRepository.js";

function progressBar(current: number, target: number): string {
  const width = 10;
  const filled = Math.min(
    width,
    target > 0 ? Math.round((current / target) * width) : 0,
  );
  const empty = width - filled;
  return `${"█".repeat(filled)}${"░".repeat(empty)}`;
}

function questLine(quest: DailyQuestRow): string {
  const status =
    quest.completed && !quest.claimed
      ? " ✅ Ready to claim!"
      : quest.claimed
        ? " ✅ Claimed"
        : "";
  const progress =
    quest.completed && quest.claimed
      ? `${String(quest.target)}/${String(quest.target)}`
      : `${String(quest.progress)}/${String(quest.target)}`;
  return [
    `${quest.emoji ?? "📋"} ${markup.bold(quest.title ?? quest.quest_key)}${status}`,
    markup.italic(quest.description ?? ""),
    `${progressBar(quest.progress, quest.target)} ${progress} · +${String(quest.reward_xp)} XP · +${String(quest.reward_coins)} coins`,
  ].join("\n");
}

export function dailyQuestsEmbed(
  quests: DailyQuestRow[],
): ReturnType<typeof campfireEmbed> {
  const completed = quests.filter((quest) => quest.completed).length;

  return campfireEmbed()
    .setTitle("📋 Daily Quests")
    .setDescription(
      [
        "Three little errands to make today worth remembering. Progress counts while you play.",
        "",
        ...quests.map(questLine),
        "",
        `Completed: ${String(completed)}/${String(quests.length)}`,
      ].join("\n"),
    )
    .setFooter({
      text: "Quests reset at midnight. Claim bonuses before they're gone.",
    });
}

export function dailyClaimedEmbed(
  quest: DailyQuestRow,
  summary: RewardSummary,
): ReturnType<typeof campfireEmbed> {
  const rewards = rewardLines(summary);
  return campfireEmbed()
    .setTitle(
      `✅ ${quest.emoji ?? "📋"} ${quest.title ?? quest.quest_key} complete!`,
    )
    .setDescription(
      ["You finished the job. Here's your reward:", "", ...rewards].join("\n"),
    );
}
