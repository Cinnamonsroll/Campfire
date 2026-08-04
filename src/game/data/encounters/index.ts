import type { EncounterDefinition } from "#src/game/types.js";
import { BEACH_ENCOUNTERS } from "./beach.js";
import { CAMP_ENCOUNTERS } from "./camp.js";
import { CAVE_ENCOUNTERS } from "./cave.js";
import { CLIFFS_ENCOUNTERS } from "./cliffs.js";
import { FESTIVAL_ENCOUNTERS } from "./festival.js";
import { FOREST_ENCOUNTERS } from "./forest.js";
import { LAKE_ENCOUNTERS } from "./lake.js";
import { MARSH_ENCOUNTERS } from "./marsh.js";
import { MEADOW_ENCOUNTERS } from "./meadow.js";
import { MOUNTAIN_ENCOUNTERS } from "./mountain.js";
import { RIVER_ENCOUNTERS } from "./river.js";
import { WATERFALL_ENCOUNTERS } from "./waterfall.js";

export const ENCOUNTER_TABLES: Record<string, EncounterDefinition[]> = {
  beach: BEACH_ENCOUNTERS,
  camp: CAMP_ENCOUNTERS,
  cave: CAVE_ENCOUNTERS,
  cliffs: CLIFFS_ENCOUNTERS,
  festival: FESTIVAL_ENCOUNTERS,
  forest: FOREST_ENCOUNTERS,
  lake: LAKE_ENCOUNTERS,
  marsh: MARSH_ENCOUNTERS,
  meadow: MEADOW_ENCOUNTERS,
  mountain: MOUNTAIN_ENCOUNTERS,
  river: RIVER_ENCOUNTERS,
  waterfall: WATERFALL_ENCOUNTERS,
};
