import { SlashCommandBuilder } from "discord.js";
import { buildClaimRow } from "../discord/components/daily/buildDailyComponents.js";
import { dailyQuestsEmbed } from "../embeds/index.js";
import { getDailyQuests } from "../game/services/dailyQuestService.js";
import { hasCharacter } from "../guards/index.js";
import { Command } from "../types/index.js";


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
