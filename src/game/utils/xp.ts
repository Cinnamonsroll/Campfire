interface XpHolder {
  level: number;
  xp: number;
}

export interface GrantXpResult {
  levelsGained: number;
  previousLevel: number;
  currentLevel: number;
  remainingXp: number;
  nextLevelXp: number;
}

export function xpToNextLevel(level: number): number {
  return 100 + (level - 1) * 50 + (level - 1) ** 2 * 10;
}

export function grantXp(player: XpHolder, amount: number): GrantXpResult {
  const previousLevel = player.level;
  player.xp += amount;

  let levelsGained = 0;
  while (player.xp >= xpToNextLevel(player.level)) {
    player.xp -= xpToNextLevel(player.level);
    player.level += 1;
    levelsGained += 1;
  }

  return {
    levelsGained,
    previousLevel,
    currentLevel: player.level,
    remainingXp: player.xp,
    nextLevelXp: xpToNextLevel(player.level),
  };
}
