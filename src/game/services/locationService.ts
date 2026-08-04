import { LOCATIONS } from "#src/game/data/locations.js";
import type { LocationDefinition } from "#src/game/types.js";

export function getUnlockedLocations(level: number): LocationDefinition[] {
  return Object.values(LOCATIONS)
    .filter(
      (location) => location.unlockLevel > 0 && location.unlockLevel <= level,
    )
    .sort(
      (a, b) => a.unlockLevel - b.unlockLevel || a.name.localeCompare(b.name),
    );
}
