import { LOCATIONS } from "../data/locations.js";
import type { LocationDefinition } from "../types.js";

export function getLockedLocations(level: number): LocationDefinition[] {
  return Object.values(LOCATIONS).filter(
    (location) => location.unlockLevel > 0 && location.unlockLevel > level,
  );
}
