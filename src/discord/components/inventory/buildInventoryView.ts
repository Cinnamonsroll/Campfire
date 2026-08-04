import type { Player } from "../../../database/repositories/playerRepository.js";
import {
  buildFilterOptions,
  filterSections,
  getInventoryView,
  type InventoryCategoryView,
  type InventoryFilter,
  type InventoryFilterOption,
  type InventoryView,
} from "../../../game/services/inventory/index.js";
import {
  buildInventoryComponents,
  type InventoryComponentPayload,
} from "./buildInventoryComponents.js";

const DEFAULT_OWNER_NAME = "Camper";

export type InventoryRenderModel =
  EmptyInventoryRenderModel | FilledInventoryRenderModel;

export interface EmptyInventoryRenderModel {
  readonly kind: "empty";
  readonly ownerName: string;
}

export interface FilledInventoryRenderModel {
  readonly kind: "items";
  readonly ownerName: string;
  readonly filter: InventoryFilter;
  readonly sections: readonly InventoryCategoryView[];
  readonly filterOptions: readonly InventoryFilterOption[];
}

export function buildInventoryView(
  view: InventoryView,
  filter: InventoryFilter,
): InventoryRenderModel {
  if (view.totalItems === 0) {
    return { kind: "empty", ownerName: view.ownerName };
  }

  return {
    kind: "items",
    ownerName: view.ownerName,
    filter,
    sections: filterSections(view, filter),
    filterOptions: buildFilterOptions(view),
  };
}

export async function buildInventoryReply(
  player: Pick<Player, "id" | "character_name">,
  filter: InventoryFilter,
): Promise<InventoryComponentPayload> {
  const ownerName = player.character_name ?? DEFAULT_OWNER_NAME;
  const view = await getInventoryView(player.id, ownerName);
  return buildInventoryComponents(buildInventoryView(view, filter));
}
