import {
  buildFilterOptions,
  filterSections,
  getJournalView,
  type JournalCategoryView,
  type JournalFilter,
  type JournalFilterOption,
  type JournalView,
} from "#src/game/services/journal/index.js";
import type { Player } from "#src/database/repositories/playerRepository.js";
import {
  buildJournalComponents,
  type JournalComponentPayload,
} from "./buildJournalComponents.js";

const DEFAULT_OWNER_NAME = "Camper";

export type JournalRenderModel =
  EmptyJournalRenderModel | FilledJournalRenderModel;

export interface EmptyJournalRenderModel {
  readonly kind: "empty";
  readonly ownerName: string;
}

export interface FilledJournalRenderModel {
  readonly kind: "discoveries";
  readonly ownerName: string;
  readonly totalEntries: number;
  readonly totalDiscovered: number;
  readonly filter: JournalFilter;
  readonly sections: readonly JournalCategoryView[];
  readonly filterOptions: readonly JournalFilterOption[];
}

export function buildJournalView(
  view: JournalView,
  filter: JournalFilter,
): JournalRenderModel {
  if (view.totalEntries === 0) {
    return { kind: "empty", ownerName: view.ownerName };
  }

  return {
    kind: "discoveries",
    ownerName: view.ownerName,
    totalEntries: view.totalEntries,
    totalDiscovered: view.totalDiscovered,
    filter,
    sections: filterSections(view, filter),
    filterOptions: buildFilterOptions(view),
  };
}

export async function buildJournalReply(
  player: Pick<Player, "id" | "character_name">,
  filter: JournalFilter,
): Promise<JournalComponentPayload> {
  const ownerName = player.character_name ?? DEFAULT_OWNER_NAME;
  const view = await getJournalView(player.id, ownerName);
  return buildJournalComponents(buildJournalView(view, filter));
}
