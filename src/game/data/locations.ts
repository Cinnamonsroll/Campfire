import type { LocationDefinition } from "#src/game/types.js";

export const LOCATIONS: Record<string, LocationDefinition> = {
  camp: {
    key: "camp",
    name: "Camp Solstice",
    description: "The central clearing where every adventure begins and ends.",
    emoji: "🏕",
    unlockLevel: 1,
    energyCost: 0,
    encounterTable: "camp",
    lootTable: "camp",
    weather: ["sunny", "cloudy", "rainy"],
    rewards: {},
    dangerLevel: 0,
    travelMessage:
      "You make your way back through the familiar paths toward the central clearing.",
    returnMessage: "The campfire crackles warmly as you arrive home.",
    unlockText:
      "The trail opens into a sun-dappled clearing. Tents dot the perimeter and a fire pit smolders at the center. Camp Solstice feels like home already.",
  },

  beach: {
    key: "beach",
    name: "Sunny Beach",
    description: "Golden sand and gentle waves stretch along the shore.",
    emoji: "🏖",
    unlockLevel: 1,
    energyCost: 10,
    encounterTable: "beach",
    lootTable: "beach",
    music: "waves",
    weather: ["sunny", "cloudy"],
    rewards: {
      fish: true,
      treasures: true,
      photos: true,
    },
    dangerLevel: 1,
    travelMessage:
      "You follow the sound of crashing waves until the warm sand meets your feet.",
    returnMessage:
      "With a pocket full of memories, you head back toward Camp Solstice.",
    unlockText:
      "As the trees begin to thin, sunlight reflects off an endless stretch of water. The beach has been added to your map.",
  },

  forest: {
    key: "forest",
    name: "Whispering Pines",
    description:
      "Tall pines rise toward the sky, their needles softening every sound.",
    emoji: "🌲",
    unlockLevel: 1,
    energyCost: 20,
    encounterTable: "forest",
    lootTable: "forest",
    music: "birds",
    weather: ["sunny", "cloudy", "rainy"],
    rewards: {
      forage: true,
      treasures: true,
      photos: true,
    },
    dangerLevel: 2,
    travelMessage:
      "The trail narrows as you step beneath the canopy. Sunlight filters through the needles in golden beams.",
    returnMessage:
      "You emerge from the treeline as the campfire comes into view, the forest's hush slowly releasing its hold.",
    unlockText:
      "A narrow trail winds through the pines. The forest feels quiet... almost inviting.",
  },

  lake: {
    key: "lake",
    name: "Crystal Lake",
    description: "Still, glassy water reflects the sky like a mirror.",
    emoji: "🏞",
    unlockLevel: 3,
    energyCost: 15,
    encounterTable: "lake",
    lootTable: "lake",
    music: "lake",
    weather: ["sunny", "cloudy"],
    rewards: {
      fish: true,
      photos: true,
    },
    dangerLevel: 2,
    travelMessage:
      "The path descends gently until the glint of water appears through the trees.",
    returnMessage:
      "You leave the lakeshore behind, the sound of lapping water fading into the forest.",
    unlockText:
      "The trees part to reveal a lake so clear you can see the bottom. Ripples spread from a fish breaking the surface nearby.",
  },

  river: {
    key: "river",
    name: "Silver River",
    description: "Crystal-clear water rushes over smooth, sun-warmed stones.",
    emoji: "🪨",
    unlockLevel: 5,
    energyCost: 18,
    encounterTable: "river",
    lootTable: "river",
    music: "river",
    weather: ["sunny", "cloudy", "rainy"],
    rewards: {
      fish: true,
      forage: true,
      treasures: true,
    },
    dangerLevel: 3,
    travelMessage:
      "The rumble of moving water grows louder as you push through the underbrush.",
    returnMessage:
      "You climb away from the riverbank, the rush of water slowly diminishing behind you.",
    unlockText:
      "The ground trembles faintly as you approach. Silver River cuts through the landscape, its current singing over ancient stones.",
  },

  meadow: {
    key: "meadow",
    name: "Wildflower Meadow",
    description: "A sea of wildflowers sways gently in the warm breeze.",
    emoji: "🌸",
    unlockLevel: 5,
    energyCost: 12,
    encounterTable: "meadow",
    lootTable: "meadow",
    weather: ["sunny", "cloudy"],
    rewards: {
      forage: true,
      photos: true,
    },
    dangerLevel: 1,
    travelMessage:
      "The forest thins and suddenly you're surrounded by an ocean of blossoms.",
    returnMessage:
      "You wade back through the flowers toward the treeline, pollen catching in the breeze.",
    unlockText:
      "The tree line falls away and a meadow explodes with color. Every shade of wildflower stretches to the horizon, buzzing with life.",
  },

  waterfall: {
    key: "waterfall",
    name: "Moonfall Falls",
    description: "A magnificent cascade plunges into a misty emerald pool.",
    emoji: "🌊",
    unlockLevel: 8,
    energyCost: 22,
    encounterTable: "waterfall",
    lootTable: "waterfall",
    music: "waterfall",
    weather: ["sunny", "cloudy", "rainy"],
    rewards: {
      treasures: true,
      photos: true,
    },
    dangerLevel: 3,
    travelMessage:
      "A distant roar guides you through the dense foliage toward the falls.",
    returnMessage:
      "You tear your gaze from the cascading water and head back, the roar fading into memory.",
    unlockText:
      "Through the mist you see it: Moonfall Falls. Water drops from an impossible height, catching rainbows in its spray before crashing into a pool the color of jade.",
  },

  cliffs: {
    key: "cliffs",
    name: "Seabreeze Cliffs",
    description: "Wind-carved cliffs overlook the vast, sparkling ocean.",
    emoji: "⛰",
    unlockLevel: 10,
    energyCost: 25,
    encounterTable: "cliffs",
    lootTable: "cliffs",
    music: "cliffs",
    weather: ["sunny", "cloudy"],
    rewards: {
      treasures: true,
      photos: true,
    },
    dangerLevel: 4,
    travelMessage:
      "The terrain grows rocky as the sound of seabirds grows louder.",
    returnMessage:
      "You descend from the cliffs, the salt wind slowly replaced by the scent of pine.",
    unlockText:
      "The ground falls away sharply. Seabreeze Cliffs stretch along the coast, their weathered faces carved by centuries of wind and spray.",
  },

  marsh: {
    key: "marsh",
    name: "Firefly Marsh",
    description:
      "Eerie and beautiful, the marsh glows with bioluminescent life at dusk.",
    emoji: "🪄",
    unlockLevel: 12,
    energyCost: 20,
    encounterTable: "marsh",
    lootTable: "marsh",
    weather: ["cloudy", "rainy"],
    rewards: {
      forage: true,
      treasures: true,
    },
    dangerLevel: 3,
    travelMessage:
      "The ground grows soft and damp. Wisps of mist coil between twisted roots.",
    returnMessage:
      "You squelch back onto firmer ground, the marsh's glow fading behind the treeline.",
    unlockText:
      "The path turns to soft earth. Fireflies rise in clouds from the marsh grass, their light pulsing in silent conversation.",
  },

  cave: {
    key: "cave",
    name: "Tide Caverns",
    description:
      "Sea caves carved by ancient tides, filled with crystal formations.",
    emoji: "🕯",
    unlockLevel: 15,
    energyCost: 28,
    encounterTable: "cave",
    lootTable: "cave",
    music: "cave",
    weather: ["sunny", "cloudy", "rainy"],
    rewards: {
      treasures: true,
      photos: true,
    },
    dangerLevel: 5,
    travelMessage:
      "Darkness swallows the light as you step into the cavern mouth.",
    returnMessage:
      "You blink as daylight hits your eyes, the cool dark of the caves already feeling distant.",
    unlockText:
      "A dark opening in the cliff face beckons. The sound of dripping water echoes from within. Tide Caverns await exploration.",
  },

  mountain: {
    key: "mountain",
    name: "Sunpeak Trail",
    description:
      "A winding trail that climbs to a summit with breathtaking views.",
    emoji: "🏔",
    unlockLevel: 18,
    energyCost: 30,
    encounterTable: "mountain",
    lootTable: "mountain",
    music: "mountain",
    weather: ["sunny", "cloudy", "rainy"],
    rewards: {
      treasures: true,
      photos: true,
    },
    dangerLevel: 5,
    travelMessage:
      "The air grows thin and cool as you begin the steady climb upward.",
    returnMessage:
      "Your legs ache as you descend, but the memories of the view keep you smiling.",
    unlockText:
      "The trail steepens and the trees shrink to scrub. Above the treeline, Sunpeak Trail stretches toward a summit that seems to brush the sky.",
  },

  festival: {
    key: "festival",
    name: "Summer Festival",
    description:
      "A rare gathering of campers from every corner of Solstice, full of music, games, and wonder under the stars.",
    emoji: "🎪",
    unlockLevel: 0,
    energyCost: 0,
    encounterTable: "festival",
    lootTable: "festival",
    music: "festival",
    weather: ["sunny", "cloudy"],
    rewards: {
      forage: false,
      treasures: true,
      photos: true,
    },
    dangerLevel: 0,
    travelMessage:
      "The distant sound of music and laughter guides your steps toward the festival grounds.",
    returnMessage:
      "You carry the warmth of the festival back with you, the glow of lanterns still dancing in your memory.",
    unlockText:
      "The forest opens onto a dazzling scene. Strings of lanterns crisscross the clearing, and laughter mingles with music. The Summer Festival is in full swing.",
  },
};
