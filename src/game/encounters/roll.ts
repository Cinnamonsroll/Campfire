import type { EncounterDefinition } from "#/game/types.js";

export function rollEncounter(
  table: EncounterDefinition[],
): EncounterDefinition {
  const totalWeight = table.reduce(
    (sum, encounter) => sum + encounter.weight,
    0,
  );

  let roll = Math.random() * totalWeight;
  for (const encounter of table) {
    roll -= encounter.weight;
    if (roll < 0) return encounter;
  }

  return table[table.length - 1];
}
