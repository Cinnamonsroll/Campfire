import { SlashCommandBuilder } from "discord.js";
import { buildClaimRow } from "../discord/components/daily/buildDailyComponents";
import { dailyQuestsEmbed } from "../embeds";
import { getDailyQuests } from "../game/services/dailyQuestService";
import { hasCharacter } from "../guards";
import { Command } from "../types";


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
