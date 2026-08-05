import { LOCATIONS } from "../data/locations.js";
import type { LocationDefinition } from "../types.js";

export function getActivityLocations(
  locationKeys: readonly string[],
  level: number,
): LocationDefinition[] {
  return locationKeys
    .map((key) => LOCATIONS[key])
    .filter((location) => location.unlockLevel > 0)
    .filter((location) => location.unlockLevel <= level)
    .sort(
      (a, b) => a.unlockLevel - b.unlockLevel || a.name.localeCompare(b.name),
    );
}
