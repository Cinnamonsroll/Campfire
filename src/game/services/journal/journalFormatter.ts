import type { ItemRarity } from "../game/types.js";
import { markup } from "../utils/markup.js";
import type { JournalCategoryView, JournalEntry } from "./journalService.js";

const RARITY_TAG: Record<ItemRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
};

export function formatJournalHeader(ownerName: string): string {
  return `📔 ${markup.bold(`${ownerName}'s Field Journal`)}`;
}

export function formatJournalSubtitle(
  discovered: number,
  total: number,
): string {
  return `Every treasure, trinket, and tall tale you've stumbled across lives here.\n🧭 Discovered: ${markup.bold(
    `${String(discovered)} / ${String(total)}`,
  )}`;
}

export function formatJournalCategoryHeader(
  section: JournalCategoryView,
): string {
  return `${section.emoji} ${markup.bold(section.label)} (${String(
    section.discovered,
  )}/${String(section.entries.length)})`;
}

export function formatFoundDate(foundAt: Date): string {
  return new Date(foundAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatJournalEntry(entry: JournalEntry): string {
  if (!entry.discovered) {
    return [
      `> ❓ ${markup.bold("???")}`,
      `> ${markup.italic("Not yet discovered.")}`,
    ].join("\n");
  }

  const date = entry.foundAt ? formatFoundDate(entry.foundAt) : "someday";

  return [
    `> ${entry.emoji} ${markup.bold(entry.name)} · ${RARITY_TAG[entry.rarity]}`,
    `> ${entry.description}`,
    `> ${markup.italic(`Found ${date}`)}`,
  ].join("\n");
}

export function formatJournalEntries(entries: readonly JournalEntry[]): string {
  return entries.map(formatJournalEntry).join("\n");
}

export function formatEmptyJournal(ownerName: string): string {
  return `📔 ${markup.bold(
    `${ownerName}'s journal is empty.`,
  )}\nExplore the beach or forest to make your first discoveries.`;
}
