interface IngredientRequirement {
  itemKey: string;
  quantity: number;
}

type MealEffect =
  | { type: "energy"; amount: number }
  | { type: "full_energy" }
  | { type: "xp_buff"; multiplier: number; adventures: number };

export interface RecipeDefinition {
  key: string;
  name: string;
  emoji: string;
  description: string;
  ingredients: readonly IngredientRequirement[];
  effect: MealEffect;
}

export const RECIPES: Record<string, RecipeDefinition> = {
  lemonade: {
    key: "lemonade",
    name: "Lemonade",
    emoji: "🍋",
    description: "A sweet, icy glass of summer that restores 20 Energy.",
    ingredients: [
      { itemKey: "wild_berries", quantity: 2 },
      { itemKey: "herbs", quantity: 1 },
    ],
    effect: { type: "energy", amount: 20 },
  },
  packed_lunch: {
    key: "packed_lunch",
    name: "Packed Lunch",
    emoji: "🥪",
    description: "Enough food to bring your Energy back to maximum.",
    ingredients: [
      { itemKey: "wild_berries", quantity: 3 },
      { itemKey: "herbs", quantity: 2 },
    ],
    effect: { type: "full_energy" },
  },
  camp_stew: {
    key: "camp_stew",
    name: "Camp Stew",
    emoji: "🍲",
    description: "A hearty stew. +15% XP for your next 3 adventures.",
    ingredients: [
      { itemKey: "truffle", quantity: 1 },
      { itemKey: "wild_berries", quantity: 2 },
      { itemKey: "herbs", quantity: 2 },
    ],
    effect: { type: "xp_buff", multiplier: 0.15, adventures: 3 },
  },
};

export function getCookableRecipes(
  owned: ReadonlyMap<string, number>,
): RecipeDefinition[] {
  return Object.values(RECIPES).filter((recipe) =>
    recipe.ingredients.every(
      (ingredient) => (owned.get(ingredient.itemKey) ?? 0) >= ingredient.quantity,
    ),
  );
}
