import type { EncounterDefinition } from "#/game/types.js";

export const CAMP_ENCOUNTERS: EncounterDefinition[] = [
  {
    key: "camp_storytelling",
    name: "Storytelling Circle",
    emoji: "📖",
    weight: 25,
    flavorText:
      "Campers have gathered around the fire, passing a story between them like a warm loaf of bread. They wave you into the circle, and before the embers settle, you've added a tale of your own.",
    resultText: "📖 You traded stories around the fire!",
    energyCost: 0,
    rewards: {
      xp: 15,
      coins: 0,
      items: [{ itemKey: "camp_story", quantity: 1 }],
    },
  },
  {
    key: "camp_cooking",
    name: "Campfire Cooking",
    emoji: "🍲",
    weight: 25,
    flavorText:
      "The smell of something delicious drifts from a pot hanging over the fire. You help stir and season, and before long the whole clearing is sharing bowls of the best stew of the summer.",
    resultText: "🍲 You helped cook for the whole camp!",
    energyCost: 0,
    rewards: {
      xp: 12,
      coins: 5,
      items: [],
    },
  },
  {
    key: "camp_stargazing",
    name: "Stargazing",
    emoji: "✨",
    weight: 20,
    flavorText:
      "The night sky is impossibly clear, a canopy of stars stretching from horizon to horizon. Someone points out a constellation you've never noticed before, and for a while the world feels small and kind.",
    resultText: "✨ You learned a new constellation!",
    energyCost: 0,
    rewards: {
      xp: 25,
      coins: 0,
      items: [],
    },
  },
  {
    key: "camp_blanket",
    name: "A Camper's Gift",
    emoji: "🧣",
    weight: 20,
    flavorText:
      'A camper heading home presses a soft woolen blanket into your hands. "Take it," she says. "Someone should get some use out of it." The blanket still smells faintly of campfire smoke.',
    resultText: "🧣 A camper gifted you a Warm Blanket!",
    energyCost: 0,
    rewards: {
      xp: 10,
      coins: 0,
      items: [{ itemKey: "warm_blanket", quantity: 1 }],
    },
  },
];
