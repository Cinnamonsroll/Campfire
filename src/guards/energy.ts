import type { Guard } from "../guards/index.js";

export function energyAtLeast(min: number): Guard {
  return (ctx) => {
    if (!ctx.player || ctx.player.energy >= min) return true;
    return {
      message: "You're running low on energy. Rest up, then head out again.",
    };
  };
}
