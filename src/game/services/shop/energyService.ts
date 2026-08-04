import { pool } from "../../../database/client.js";
import type { Db } from "../../../database/db.js";
import {
  findByPlayerId as findCamp,
  type PlayerCamp,
} from "../../../database/repositories/campRepository.js";
import {
  update as updatePlayer,
  type Player,
} from "../../../database/repositories/playerRepository.js";
import { getBuildingLevel, getMaxEnergy } from "../campService.js";

export const ENERGY_RESTORE_HOURS = 12;

const ENERGY_RESTORE_MS = ENERGY_RESTORE_HOURS * 60 * 60 * 1000;

export function maxEnergyForCamp(camp: PlayerCamp | null): number {
  return getMaxEnergy(getBuildingLevel(camp, "tent"));
}

export async function getMaxEnergyForPlayer(
  player: Player,
  db: Db = pool,
): Promise<number> {
  const camp = await findCamp(player.id, db);
  return maxEnergyForCamp(camp);
}

export async function restoreEnergyToFull(
  player: Player,
  db: Db = pool,
): Promise<void> {
  const max = await getMaxEnergyForPlayer(player, db);
  await updatePlayer(
    player.id,
    { energy: max, last_energy_reset: new Date() },
    db,
  );
  player.energy = max;
}

export async function tryPassiveRestore(
  player: Player,
  db: Db = pool,
): Promise<boolean> {
  const max = await getMaxEnergyForPlayer(player, db);
  if (player.energy >= max) return false;

  if (player.last_energy_reset === null) {
    await updatePlayer(player.id, { last_energy_reset: new Date() }, db);
    return false;
  }

  const elapsed = Date.now() - player.last_energy_reset.getTime();
  if (elapsed < ENERGY_RESTORE_MS) return false;

  await restoreEnergyToFull(player, db);
  return true;
}
