import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/index.js";
import { hasCharacter, notInAdventure } from "../guards/index.js";
import { buildFishSelectPayload } from "../discord/components/game/buildFishComponents.js";
import { buildGatherSelectPayload } from "../discord/components/game/buildGatherComponents.js";
import { buildCookPayload } from "../discord/components/game/buildCookComponents.js";
import { buildCatchSelectPayload } from "../discord/components/game/buildCatchComponents.js";
import { buildPhotoSelectPayload } from "../discord/components/game/buildPhotographComponents.js";
import { getActivityLocations } from "../game/activities/locations.js";
import { FISH_LOCATION_KEYS } from "../game/activities/fish/data.js";
import { GATHER_LOCATION_KEYS } from "../game/activities/gather/data.js";
import { CATCH_LOCATION_KEYS } from "../game/activities/catch/data.js";
import { PHOTO_LOCATION_KEYS } from "../game/activities/photograph/data.js";
import { RECIPES, getCookableRecipes } from "../game/activities/cook/data.js";
import { getOwnedIngredients } from "../game/activities/cook/cookService.js";
import { getMaxEnergyForPlayer } from "../game/services/shop/index.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("game")
    .setDescription("Specialized activities to earn rewards and fill your journal")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("fish")
        .setDescription("Cast a line and reel in a catch before it gets away"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("gather")
        .setDescription("Gather materials to upgrade your camp"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("cook")
        .setDescription("Cook meals from gathered ingredients"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("catch")
        .setDescription("Follow insect movement patterns to catch them"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("photograph")
        .setDescription("Capture wildlife for your album"),
    ),
  guards: [hasCharacter, notInAdventure],
  async execute(ctx) {
    const player = ctx.player;
    if (!player) return;
    const interaction = ctx.interaction;

    switch (interaction.options.getSubcommand()) {
      case "fish": {
        const locations = getActivityLocations(FISH_LOCATION_KEYS, player.level);
        await interaction.reply(
          buildFishSelectPayload(locations, player.energy),
        );
        return;
      }
      case "gather": {
        const locations = getActivityLocations(GATHER_LOCATION_KEYS, player.level);
        await interaction.reply(
          buildGatherSelectPayload(locations, player.energy),
        );
        return;
      }
      case "cook": {
        const [owned, maxEnergy] = await Promise.all([
          getOwnedIngredients(player),
          getMaxEnergyForPlayer(player),
        ]);
        const cookable = getCookableRecipes(owned);
        const unavailable = Object.values(RECIPES).filter(
          (recipe) => !cookable.some((entry) => entry.key === recipe.key),
        );
        await interaction.reply(
          buildCookPayload(
            cookable,
            unavailable,
            owned,
            player.energy,
            maxEnergy,
          ),
        );
        return;
      }
      case "catch": {
        const locations = getActivityLocations(CATCH_LOCATION_KEYS, player.level);
        await interaction.reply(
          buildCatchSelectPayload(locations, player.energy),
        );
        return;
      }
      case "photograph": {
        const locations = getActivityLocations(
          PHOTO_LOCATION_KEYS,
          player.level,
        );
        await interaction.reply(
          buildPhotoSelectPayload(locations, player.energy),
        );
        return;
      }
      default:
        return;
    }
  },
};

export default command;
