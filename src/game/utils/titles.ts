export function getTitle(level: number): string {
  if (level >= 20) return "Camp Legend";
  if (level >= 15) return "Ranger";
  if (level >= 10) return "Explorer";
  if (level >= 5) return "Trailblazer";
  return "New Camper";
}
