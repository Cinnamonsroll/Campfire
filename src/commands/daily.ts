import { SlashCommandBuilder } from "discord.js";
import type { Command } from "#src/types/index.js";
import { hasCharacter } from "#src/guards/index.js";
import { dailyQuestsEmbed } from "#src/embeds/index.js";
import { buildClaimRow } from "#src/discord/components/daily/buildDailyComponents.js";
import { getDailyQuests } from "#src/game/services/dailyQuestService.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("View today's daily quests"),
  guards: [hasCharacter],
  async execute(ctx) {
    const player = ctx.player;
    if (!player) return;

    const quests = await getDailyQuests(player.id, player.discord_id);
    const claimable = quests.filter(
      (quest) => quest.completed && !quest.claimed,
    );

    await ctx.interaction.reply({
      embeds: [dailyQuestsEmbed(quests)],
      components: claimable.length > 0 ? [buildClaimRow(claimable)] : [],
    });
  },
};

export default command;
