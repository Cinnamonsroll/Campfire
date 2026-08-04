import { markup } from "../../../utils/markup.js";

export interface HelpPage {
  emoji: string;
  title: string;
  content: string;
}

function commandLine(command: string, description: string): string {
  return `${markup.bold(markup.inline(command))} ${description}`;
}

function section(header: string, lines: readonly string[]): string {
  return [markup.bold(header), ...lines.map((line) => `• ${line}`)].join("\n");
}

const getStartedPage: HelpPage = {
  emoji: "🏕",
  title: "Welcome to Camp Solstice",
  content: [
    "You're a camper at Camp Solstice for one long, golden summer. Explore the trails, fill your journal, and make the fire your home.",
    "",
    commandLine("/start", "Create your camper and receive your starter gear."),
    commandLine(
      "/play",
      "Pick a trail and head out. Adventures cost energy and reward XP, coins, and items.",
    ),
    commandLine(
      "/camp",
      "See your campsite and upgrade your Tent, Campfire, and Storage.",
    ),
    commandLine(
      "/inventory",
      "Browse everything you're carrying. Storage has a limit, so keep it tidy.",
    ),
    commandLine(
      "/journal",
      "Track every discovery you've made and the ones still out there.",
    ),
    commandLine(
      "/daily",
      "Three fresh quests every day. Claim rewards before midnight.",
    ),
    commandLine(
      "/shop",
      "Visit the camp store. Fresh supplies arrive every morning.",
    ),
    commandLine(
      "/trade",
      "Swap items and coins with another camper at the Trading Post.",
    ),
    commandLine("/statistics", "Review your lifetime stats as a camper."),
    "",
    "Every command works right here, no matter where you're camping from.",
  ].join("\n"),
};

const guidePage: HelpPage = {
  emoji: "📖",
  title: "The Guide",
  content: [
    section("Leveling Up", [
      "Completing adventures and claiming quests grants XP. Reach the bar to level up.",
      "Each level unlocks new trails and raises your caps.",
      "The Campfire's XP boost applies to everything you earn.",
    ]),
    "",
    section("Energy & Rest", [
      "Adventures cost energy. When you run low, rest and it recovers.",
      "A higher-level Tent raises your maximum energy.",
      "The camp store sometimes sells lemonade for a quick, full refill.",
    ]),
    "",
    section("Your Campsite", [
      "Tent: raises your max energy as it grows.",
      "Campfire: boosts the XP you earn from everything.",
      "Storage: every find takes up space. Upgrade it to carry more before heading out.",
    ]),
    "",
    section("Journal & Daily Quests", [
      "Every item you've ever found is recorded in your Journal. Fill a section to complete it, and the whole book for a very special reward.",
      "Each morning you're handed three little errands. Progress counts automatically while you play.",
      "Achievements hide around every corner of the summer and unlock with coins when you earn them.",
    ]),
    "",
    section("The Trading Post", [
      "Use /trade with another camper to open the Trading Post.",
      "The buttons only touch your own side. Add items or coins, refine, and accept when you're both ready.",
      "Everything is swapped at once, so there's no room for tricks. Trades expire after a few minutes.",
    ]),
    "",
    "Trails unlock as you grow:",
    "• Level 1 - Sunny Beach, Whispering Pines",
    "• Level 3 - Crystal Lake",
    "• Level 5 - Silver River, Wildflower Meadow",
    "• Level 8 - Moonfall Falls",
    "• Level 10 - Seabreeze Cliffs",
    "• Level 12 - Firefly Marsh",
    "• Level 15 - Tide Caverns",
    "• Level 18 - Sunpeak Trail",
  ].join("\n"),
};

const tipsPage: HelpPage = {
  emoji: "🔥",
  title: "Handy Tips",
  content: [
    section("Around the Fire", [
      "Fish only bite where there's water. Check each trail's rewards before you go.",
      "Rare finds like Sea Glass, Pearls, and Truffles are the currency of camp. Hang onto them for upgrades.",
      "Upgrade Storage before your pack overflows. A full pack means missed loot.",
      "The Campfire's XP boost pays for itself fast. Raise it early.",
      "Daily quests roll fresh at midnight. Claim what you can before then.",
      "Check /shop each morning. Stock refreshes daily and never stays long.",
      "Trade duplicates with friends instead of hoarding them.",
    ]),
  ].join("\n"),
};

export const helpPages: readonly HelpPage[] = [
  getStartedPage,
  guidePage,
  tipsPage,
];
