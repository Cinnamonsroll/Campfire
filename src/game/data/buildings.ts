interface BuildingDefinition {
  key: string;
  name: string;
  emoji: string;
  description: string;
}

export const BUILDINGS: readonly BuildingDefinition[] = [
  {
    key: "tent",
    name: "Tent",
    emoji: "⛺",
    description: "Your cozy home away from home.",
  },
  {
    key: "campfire",
    name: "Campfire",
    emoji: "🔥",
    description: "Where every good story begins.",
  },
  {
    key: "storage",
    name: "Storage",
    emoji: "📦",
    description: "Keep your finds safe and sound.",
  },
];

interface ComingSoonBuilding {
  name: string;
  emoji: string;
}

export const COMING_SOON: readonly ComingSoonBuilding[] = [
  { name: "Marsh Cabin", emoji: "🛖" },
  { name: "Flower Patch", emoji: "🌻" },
];
