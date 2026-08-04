import type { EncounterDefinition } from "#/game/types.js";

export const BEACH_ENCOUNTERS: EncounterDefinition[] = [
  {
    key: "beach_shells",
    name: "Shell Scatter",
    emoji: "🐚",
    weight: 18,
    flavorText:
      "The afternoon tide has just begun to retreat, leaving the shoreline sparkling beneath the sun. Half buried in the wet sand, something catches your eye: a spiral shell catching the light.",
    resultText: "🐚 You found a beautiful Seashell!",
    energyCost: 10,
    rewards: {
      xp: 15,
      coins: 0,
      items: [{ itemKey: "seashell", quantity: 1 }],
    },
  },
  {
    key: "beach_crab",
    name: "Crab Scuttle",
    emoji: "🦀",
    weight: 18,
    flavorText:
      "A tiny crab scurries across the sand, pausing to wave a single claw as if to shoo you away. It darts sideways into a shallow burrow, leaving something behind: a perfect, pale sand dollar, smooth as porcelain.",
    resultText: "🦀 The crab's burrow reveals a perfect Sand Dollar!",
    energyCost: 10,
    rewards: {
      xp: 12,
      coins: 0,
      items: [{ itemKey: "sand_dollar", quantity: 1 }],
    },
  },
  {
    key: "beach_driftwood",
    name: "Driftwood Cache",
    emoji: "🪵",
    weight: 18,
    flavorText:
      "Waves have piled driftwood high along the tide line, each piece smoothed and bleached by sun and salt. One plank is long, sturdy, and weathered silver. Perfect kindling for a night back at camp.",
    resultText: "🪵 You gathered a sturdy piece of Driftwood!",
    energyCost: 10,
    rewards: {
      xp: 12,
      coins: 0,
      items: [{ itemKey: "driftwood", quantity: 1 }],
    },
  },
  {
    key: "beach_photograph",
    name: "Beach Memory",
    emoji: "📷",
    weight: 18,
    flavorText:
      "You raise your camera to your eye and frame the scene: sun, sand, and a horizon that refuses to end. The shutter clicks, and for a moment the whole summer feels frozen in time.",
    resultText: "📷 You captured a memorable photograph!",
    energyCost: 10,
    rewards: {
      xp: 12,
      coins: 0,
      items: [{ itemKey: "beach_photo", quantity: 1 }],
    },
  },
  {
    key: "beach_bluegill",
    name: "Patient Catch",
    emoji: "🐟",
    weight: 12,
    flavorText:
      "You wade out to the shallows, where the water runs clear and still. After waiting patiently, a flash of silver glides straight into your waiting hands: a bluegill, unhurried and unsuspecting.",
    resultText: "🐟 You caught a Bluegill!",
    energyCost: 10,
    rewards: {
      xp: 22,
      coins: 0,
      items: [{ itemKey: "bluegill", quantity: 1 }],
    },
  },
  {
    key: "beach_bottle",
    name: "Message in a Bottle",
    emoji: "🌊",
    weight: 10,
    flavorText:
      "A wave rolls in and leaves something strange behind: an old glass bottle, corked and barnacle-crusted. Inside, a few tarnished coins rattle against the glass like tiny bells.",
    resultText: "🌊 The old bottle holds a handful of coins!",
    energyCost: 10,
    rewards: {
      xp: 20,
      coins: 30,
      items: [],
    },
  },
  {
    key: "beach_sea_glass",
    name: "Sea Glass",
    emoji: "💠",
    weight: 5,
    flavorText:
      "Kneeling at the water's edge, you notice a patch of color among the pebbles: a smooth shard of sea glass, its edges frosted soft by years of rolling in the surf. You pocket it and keep searching, finding three more in every shade of the ocean.",
    resultText: "💠 You found a gleaming piece of Sea Glass!",
    energyCost: 10,
    rewards: {
      xp: 45,
      coins: 0,
      items: [{ itemKey: "sea_glass", quantity: 1 }],
    },
  },
  {
    key: "beach_pearl",
    name: "Hidden Pearl",
    emoji: "🦪",
    weight: 3,
    flavorText:
      "Tucked beneath a rock you almost stepped on, an open oyster shell rests in the shallow water. Nestled inside, impossibly round and faintly glowing, is a pearl.",
    resultText: "🦪 Hidden inside the shell is a perfect Pearl!",
    energyCost: 10,
    rewards: {
      xp: 85,
      coins: 0,
      items: [{ itemKey: "pearl", quantity: 1 }],
    },
  },
];
