export const RedisKeys = {
  adventure: (discordId: string) => `adventure:${discordId}`,
  gameFish: (discordId: string) => `game:fish:${discordId}`,
  gameCatch: (discordId: string) => `game:catch:${discordId}`,
  gamePhoto: (discordId: string) => `game:photo:${discordId}`,
};
