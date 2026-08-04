import type { EncounterDefinition } from "../../types.js";

export const FESTIVAL_ENCOUNTERS: EncounterDefinition[] = [
  {
    key: "festival_bonfire",
    name: "Grand Bonfire",
    emoji: "🔥",
    weight: 40,
    flavorText:
      "The festival's central bonfire roars toward the stars, casting dancing shadows on joyful faces. Someone hands you a stick of marshmallow.",
    resultText: "🔥 You gathered with the crowd at the bonfire!",
    energyCost: 0,
    rewards: {
      xp: 15,
      coins: 0,
      items: [],
    },
  },
  {
    key: "festival_games",
    name: "Festival Games",
    emoji: "🎯",
    weight: 35,
    flavorText:
      "Booths line the meadow with ring toss, archery, and a pie-eating contest in full swing. Cheers erupt as someone finally wins the goldfish.",
    resultText: "🎯 You joined in the festival games!",
    energyCost: 0,
    rewards: {
      xp: 18,
      coins: 0,
      items: [],
    },
  },
  {
    key: "festival_trading",
    name: "Trading Post",
    emoji: "🏪",
    weight: 25,
    flavorText:
      "Campers from far-off cabins have set up stalls, offering rare finds and handmade crafts. The air smells of cinnamon and campfire smoke.",
    resultText: "🏪 You browsed the festival trading stalls!",
    energyCost: 0,
    rewards: {
      xp: 20,
      coins: 0,
      items: [],
    },
  },
];
