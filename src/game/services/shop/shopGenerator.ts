import { ITEMS } from "#src/game/data/items.js";
import type { ItemRarity } from "#src/game/types.js";

export interface ShopEntry {
  key: string;
  name: string;
  description: string;
  flavor: string;
  emoji: string;
  rarity: ItemRarity;
  price: number;
  stock: number;
  isEnergyItem: boolean;
}

export const SHOP_MIN_ITEMS = 5;
export const SHOP_MAX_ITEMS = 8;

export const LEMONADE_KEY = "lemonade";
export const LEMONADE_NAME = "Lemonade";
export const LEMONADE_EMOJI = "🍋";
export const LEMONADE_DESCRIPTION = "Restores Energy to Maximum";
export const LEMONADE_FLAVOR =
  "Freshly squeezed this morning by the camp cooks.";
export const LEMONADE_PRICE_MIN = 75;
export const LEMONADE_PRICE_MAX = 175;
export const LEMONADE_STOCK = 1;

const RARITY_PRICE_MIN: Record<ItemRarity, number> = {
  common: 15,
  uncommon: 45,
  rare: 100,
};

const RARITY_PRICE_MAX: Record<ItemRarity, number> = {
  common: 45,
  uncommon: 100,
  rare: 200,
};

const RARITY_STOCK: Record<ItemRarity, number> = {
  common: 3,
  uncommon: 2,
  rare: 1,
};

const RARITY_WEIGHT: Record<ItemRarity, number> = {
  common: 62,
  uncommon: 28,
  rare: 10,
};

const FLAVORS: Record<string, string> = {
  seashell: "A perfect spiral shell, still warm from the sun.",
  sand_dollar: "A pale coin shell with a star pressed into it.",
  driftwood: "Smooth, sun-bleached wood carried in by the tide.",
  pine_cone: "A fat pinecone, sticky with resin from the pines.",
  wild_berries: "Sweet, tart berries picked fresh off the forest floor.",
  oak_branch: "A strong, straight branch that would carve up well.",
  warm_blanket: "A soft woolen blanket that still smells of campfire smoke.",
  sea_glass: "A smooth shard of glass, frosted soft by the waves.",
  truffle: "A dark, fragrant mushroom, the forest's rarest gift.",
  bluegill: "A small, feisty fish with an iridescent shimmer.",
  beach_photo: "A Polaroid of a perfect afternoon at Sunny Beach.",
  camp_story: "A tale traded around the fire, now yours to keep.",
  pearl: "A rare, softly glowing pearl from the shallows.",
};

interface ShopItemSource {
  key: string;
  rarity: ItemRarity;
}

const POOL: readonly ShopItemSource[] = Object.keys(FLAVORS).map((key) => ({
  key,
  rarity: ITEMS[key].rarity,
}));

function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < str.length; index++) {
    hash ^= str.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function makeRng(seedBase: number): () => number {
  let seed = seedBase;
  return () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return seed / 4294967296;
  };
}

function roundToFive(value: number): number {
  return Math.round(value / 5) * 5;
}

function rollRarity(rng: () => number): ItemRarity {
  const roll = rng() * 100;
  if (roll < RARITY_WEIGHT.common) return "common";
  if (roll < RARITY_WEIGHT.common + RARITY_WEIGHT.uncommon) return "uncommon";
  return "rare";
}

export function generateShop(discordId: string, date: string): ShopEntry[] {
  const rng = makeRng(fnv1a(`${discordId}:${date}`));

  const lemonadePrice =
    LEMONADE_PRICE_MIN +
    Math.floor(rng() * (LEMONADE_PRICE_MAX - LEMONADE_PRICE_MIN + 1));

  const entries: ShopEntry[] = [
    {
      key: LEMONADE_KEY,
      name: LEMONADE_NAME,
      description: LEMONADE_DESCRIPTION,
      flavor: LEMONADE_FLAVOR,
      emoji: LEMONADE_EMOJI,
      rarity: "common",
      price: lemonadePrice,
      stock: LEMONADE_STOCK,
      isEnergyItem: true,
    },
  ];

  const extraCount =
    SHOP_MIN_ITEMS -
    1 +
    Math.floor(rng() * (SHOP_MAX_ITEMS - SHOP_MIN_ITEMS + 1));

  const available = new Set(POOL.map((source) => source.key));

  while (entries.length < extraCount + 1 && available.size > 0) {
    const rarity = rollRarity(rng);
    let candidates = POOL.filter(
      (source) => available.has(source.key) && source.rarity === rarity,
    );
    if (candidates.length === 0) {
      candidates = POOL.filter((source) => available.has(source.key));
      if (candidates.length === 0) break;
    }

    const picked = candidates[Math.floor(rng() * candidates.length)];
    available.delete(picked.key);
    const definition = ITEMS[picked.key];
    const priceRange =
      RARITY_PRICE_MAX[picked.rarity] - RARITY_PRICE_MIN[picked.rarity];
    const price = roundToFive(
      RARITY_PRICE_MIN[picked.rarity] + rng() * priceRange,
    );

    entries.push({
      key: definition.key,
      name: definition.name,
      description: definition.description,
      flavor: FLAVORS[picked.key],
      emoji: definition.emoji,
      rarity: picked.rarity,
      price,
      stock: RARITY_STOCK[picked.rarity],
      isEnergyItem: false,
    });
  }

  return entries;
}
