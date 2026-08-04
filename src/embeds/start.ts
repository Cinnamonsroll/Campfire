import { EmbedBuilder } from "discord.js";
import { campfireEmbed } from "./base.js";
import { LOCATIONS } from "#/game/data/locations.js";
import { markup } from "#/utils/markup.js";
import type { ItemDefinition } from "#/game/types.js";

export function welcomeIntro(): EmbedBuilder {
  return campfireEmbed()
    .setTitle("☀️ Welcome to Camp Solstice")
    .setDescription(
      [
        "School feels like a world away now.",
        "",
        "The old bus rolls to a stop at the gates of Camp Solstice. Summer air floods in through the open windows, warm and sweet with the scent of pine.",
        "",
        "Laughter echoes somewhere through the trees. A guitar strums a familiar song. Smoke from the campfire curls up into a bright blue sky.",
        "",
        "This is home for the next few weeks. A place where every trail leads somewhere new, and every morning brings a chance to discover something you didn't know was waiting.",
        "",
        "Every summer has a story. This one is yours.",
        "",
        "But first, let's get you settled in.",
      ].join("\n"),
    )
    .setFooter({ text: "Summer at Camp Solstice is just beginning." });
}

export function welcomeCeremony(
  name: string,
  items: ItemDefinition[],
): EmbedBuilder {
  const itemLines = items.map(
    (item) => `${item.emoji} ${markup.bold(item.name)} · ${item.description}`,
  );

  return campfireEmbed()
    .setTitle("🔥 Welcome to Camp Solstice!")
    .setDescription(
      [
        "The camp counselor grins as they tie a wooden nametag onto your backpack.",
        "",
        `"Welcome to Camp Solstice, ${name}."`,
        "",
        `"This summer is yours. Every sunrise, every trail, every quiet moment under the stars... it's all waiting for you."`,
        "",
        `"Whether you are searching hidden beaches, climbing mountain trails, or simply watching the sunset from the dock, there is always another adventure just around the corner."`,
        "",
        markup.bold("Your Camp Kit"),
        "",
        ...itemLines,
        "",
        "The path ahead splits into three directions.",
        `To the east, 🏖 ${markup.bold("Sunny Beach")} waits with golden sand and gentle waves.`,
        `To the north, 🌲 ${markup.bold("Whispering Pines")} beckons with cool shadows and towering trees.`,
        `And all around you, 🏕 ${markup.bold("Camp Solstice")} hums with the warmth of home.`,
        "",
        markup.italic(
          "Every trail hides a new discovery. Where will you go first?",
        ),
      ].join("\n"),
    )
    .setFooter({ text: "Your summer story starts now." });
}

export function locationVignette(key: string): EmbedBuilder {
  if (!(key in LOCATIONS)) {
    return campfireEmbed()
      .setTitle("Unknown Path")
      .setDescription("The path stretches out before you, full of promise.");
  }

  const location = LOCATIONS[key];

  return campfireEmbed()
    .setTitle(`${location.emoji} ${location.name}`)
    .setDescription(location.description)
    .setFooter({ text: "More adventures await..." });
}
