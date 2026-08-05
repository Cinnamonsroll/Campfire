import type { Player } from "../../../database/repositories/playerRepository.js";
import { findById, update as updatePlayer } from "../../../database/repositories/playerRepository.js";
import { pool } from "../../../database/client.js";
import type { Db } from "../../../database/db.js";
import { withTransaction } from "../../../database/transaction.js";
import {
  findQuantitiesByItemKeys,
  removeItems,
} from "../../../database/repositories/inventoryRepository.js";
import { ITEMS } from "../../data/items.js";
import { addBuff } from "../../services/buffService.js";
import { getMaxEnergyForPlayer } from "../../services/shop/index.js";
import { ActivityError } from "../rewards.js";
import { RECIPES, type RecipeDefinition } from "./data.js";

export interface CookResult {
  recipe: RecipeDefinition;
  energyBefore: number;
  energyAfter: number;
  buffApplied: { key: string; stacks: number } | null;
}

export async function getOwnedIngredients(
  player: Player,
  db: Db = pool,
): Promise<Map<string, number>> {
  const allKeys = Object.values(RECIPES).flatMap((recipe) =>
    recipe.ingredients.map((ingredient) => ingredient.itemKey),
  );
  const owned = await findQuantitiesByItemKeys(player.id, [...new Set(allKeys)], db);
  return new Map(owned.map((entry) => [entry.itemKey, entry.quantity]));
}

function missingIngredientMessage(
  recipe: RecipeDefinition,
  owned: ReadonlyMap<string, number>,
): string | null {
  for (const ingredient of recipe.ingredients) {
    if ((owned.get(ingredient.itemKey) ?? 0) < ingredient.quantity) {
      const item = ITEMS[ingredient.itemKey];
      return `You need ${String(ingredient.quantity)} ${item.name} for that recipe.`;
    }
  }
  return null;
}

export async function cook(
  player: Player,
  recipeKey: string,
): Promise<CookResult> {
  const recipe = RECIPES[recipeKey];

  const energyBefore = player.energy;

  const cookRecipe = async (tx: Db): Promise<CookResult> => {
    const fresh = await findById(player.id, tx);
    if (!fresh) {
      throw new ActivityError(
        "No camper here yet. Use `/start` to begin your summer.",
      );
    }

    const ownedRows = await findQuantitiesByItemKeys(
      fresh.id,
      recipe.ingredients.map((ingredient) => ingredient.itemKey),
      tx,
    );
    const ownedByKey = new Map(
      ownedRows.map((entry) => [entry.itemKey, entry.quantity]),
    );

    const missing = missingIngredientMessage(recipe, ownedByKey);
    if (missing) {
      throw new ActivityError(missing);
    }

    for (const ingredient of recipe.ingredients) {
      const row = ownedRows.find(
        (entry) => entry.itemKey === ingredient.itemKey,
      );
      if (row) {
        await removeItems(
          fresh.id,
          [{ itemId: row.itemId, quantity: ingredient.quantity }],
          tx,
        );
      }
    }

    let energyAfter = fresh.energy;
    let buffApplied: CookResult["buffApplied"] = null;

    switch (recipe.effect.type) {
      case "energy":
        energyAfter = Math.min(
          fresh.energy + recipe.effect.amount,
          await getMaxEnergyForPlayer(fresh, tx),
        );
        break;
      case "full_energy":
        energyAfter = await getMaxEnergyForPlayer(fresh, tx);
        break;
      case "xp_buff":
        await addBuff(fresh.id, recipe.key, recipe.effect.adventures, tx);
        buffApplied = { key: recipe.key, stacks: recipe.effect.adventures };
        break;
    }

    await updatePlayer(fresh.id, { energy: energyAfter }, tx);

    return { recipe, energyBefore, energyAfter, buffApplied };
  };

  return withTransaction(cookRecipe);
}
