import {
  ActionRowBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { GAME_COOK_SELECT_ID } from "../../customIds.js";
import { IS_COMPONENTS_V2 } from "../../constants.js";
import { CAMPFIRE_ORANGE } from "../../../embeds/base.js";
import { markup } from "../../../utils/markup.js";
import { ITEMS } from "../../../game/data/items.js";
import type { RecipeDefinition } from "../../../game/activities/cook/data.js";
import type { CookResult } from "../../../game/activities/cook/cookService.js";
import type { GameComponentPayload } from "./buildGameComponents.js";

function ingredientLine(recipe: RecipeDefinition): string {
  return recipe.ingredients
    .map(
      (ingredient) =>
        `${ITEMS[ingredient.itemKey].emoji} ${ITEMS[ingredient.itemKey].name} ×${String(ingredient.quantity)}`,
    )
    .join(" · ");
}

function effectLine(recipe: RecipeDefinition): string {
  switch (recipe.effect.type) {
    case "energy":
      return `+${String(recipe.effect.amount)} Energy`;
    case "full_energy":
      return "Restores Energy to Maximum";
    case "xp_buff":
      return `+${String(Math.round(recipe.effect.multiplier * 100))}% XP for ${String(recipe.effect.adventures)} adventures`;
  }
}

export function buildCookPayload(
  cookable: readonly RecipeDefinition[],
  unavailable: readonly RecipeDefinition[],
  owned: ReadonlyMap<string, number>,
  playerEnergy: number,
  maxEnergy: number,
): GameComponentPayload {
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `🍳 ${markup.bold("Camp Cooking")}`,
    ),
    new TextDisplayBuilder().setContent(
      `Turn gathered ingredients into meals that restore energy or grant buffs.\n⚡ ${markup.bold("Energy")}: ${String(playerEnergy)} / ${String(maxEnergy)}`,
    ),
  );

  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `🍽 ${markup.bold("Ready to Cook")}`,
    ),
  );

  if (cookable.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        markup.italic("You don't have the ingredients for any recipe yet. Go gathering first!"),
      ),
    );
  } else {
    container.addActionRowComponents(
      new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [
          new StringSelectMenuBuilder()
            .setCustomId(GAME_COOK_SELECT_ID)
            .setPlaceholder("Choose a recipe to cook")
            .addOptions(
              cookable.map((recipe) =>
                new StringSelectMenuOptionBuilder()
                  .setLabel(recipe.name)
                  .setValue(recipe.key)
                  .setEmoji(recipe.emoji)
                  .setDescription(recipe.description),
              ),
            ),
        ],
      }),
    );
    for (const recipe of cookable) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `> ${recipe.emoji} ${markup.bold(recipe.name)}\n> ${effectLine(recipe)}\n> Needs: ${ingredientLine(recipe)}`,
        ),
      );
    }
  }

  if (unavailable.length > 0) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🔒 ${markup.bold("Missing Ingredients")}`,
      ),
    );
    for (const recipe of unavailable) {
      const missing = recipe.ingredients
        .filter(
          (ingredient) =>
            (owned.get(ingredient.itemKey) ?? 0) < ingredient.quantity,
        )
        .map(
          (ingredient) =>
            `${ITEMS[ingredient.itemKey].emoji} ${ITEMS[ingredient.itemKey].name} ×${String(ingredient.quantity)}`,
        )
        .join(" · ");
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `> ${recipe.emoji} ${recipe.name}\n> Needs: ${missing}`,
        ),
      );
    }
  }

  return { components: [container], flags: IS_COMPONENTS_V2 };
}

export function buildCookResultPayload(
  result: CookResult,
  maxEnergy: number,
): GameComponentPayload {
  const { recipe, energyBefore, energyAfter, buffApplied } = result;
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `${recipe.emoji} ${markup.bold(`${recipe.name} is ready!`)}`,
    ),
    new TextDisplayBuilder().setContent(
      recipe.ingredients
        .map(
          (ingredient) =>
            `> −${ITEMS[ingredient.itemKey].emoji} ${ITEMS[ingredient.itemKey].name} ×${String(ingredient.quantity)}`,
        )
        .join("\n"),
    ),
  );

  container.addSeparatorComponents(new SeparatorBuilder());
  const effectLines: string[] = [`> ${effectLine(recipe)}`];
  if (energyBefore !== energyAfter) {
    effectLines.push(
      `> ⚡ Energy: ${String(energyBefore)} → ${String(energyAfter)} / ${String(maxEnergy)}`,
    );
  }
  if (buffApplied) {
    effectLines.push(
      `> 🍲 Buff active: +15% XP for your next ${String(buffApplied.stacks)} adventures`,
    );
  }
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(effectLines.join("\n")),
  );

  return { components: [container], flags: IS_COMPONENTS_V2 };
}
