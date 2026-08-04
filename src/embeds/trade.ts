import { campfireEmbed } from "./base.js";
import { getItemDefinition } from "#src/game/data/items.js";
import type { TradeItems } from "#src/database/repositories/tradeRepository.js";
import type {
  TradeExchangeSummary,
  TradeParticipant,
  TradeState,
} from "#src/game/services/tradeService.js";
import { markup } from "#src/utils/markup.js";

function itemLines(items: TradeItems): string[] {
  return Object.entries(items)
    .filter(([, quantity]) => quantity > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([itemKey, quantity]) => {
      const item = getItemDefinition(itemKey);
      const name = item?.name ?? itemKey;
      return quantity > 1 ? `${name} x${String(quantity)}` : name;
    });
}

function offerSection(participant: TradeParticipant): string {
  const { player, offer } = participant;
  const lines: string[] = [];

  if (offer.coins > 0) lines.push(`${String(offer.coins)} coins`);
  lines.push(...itemLines(offer.items));

  const name = player.character_name ?? "Camper";
  return lines.length === 0
    ? `${markup.bold(name)} - *nothing yet*`
    : `${markup.bold(name)}\n${lines.join("\n")}`;
}

function participantStatus(
  participant: TradeParticipant,
  invitationPending: boolean,
  receiverId: string,
): string {
  if (invitationPending) {
    return participant.player.id === receiverId
      ? "Awaiting response"
      : "Invitation sent";
  }
  return "Waiting to confirm";
}

export function tradeEmbed(
  state: TradeState,
): ReturnType<typeof campfireEmbed> {
  const { trade, sender, receiver } = state;
  const invitationPending = trade.status === "pending";
  const expiresAt = Math.floor(trade.expires_at.getTime() / 1000);
  const description = invitationPending
    ? `Waiting for ${markup.bold(receiver.player.character_name ?? "the invited camper")} to accept or decline.`
    : "Add items or coins to your side, then both campers confirm the final offer.";

  return campfireEmbed()
    .setTitle("Trading Post")
    .setDescription(
      [
        description,
        "",
        "**Your controls only change your own offer.**",
        `This trade expires <t:${String(expiresAt)}:R>.`,
      ].join("\n"),
    )
    .addFields([
      {
        name: `${participantStatus(sender, invitationPending, trade.receiver_id)} - ${offerSection(sender)}`,
        value: `_${sender.player.character_name ?? "Sender"}_`,
        inline: false,
      },
      {
        name: `${participantStatus(receiver, invitationPending, trade.receiver_id)} - ${offerSection(receiver)}`,
        value: `_${receiver.player.character_name ?? "Receiver"}_`,
        inline: false,
      },
    ])
    .setFooter({ text: "Cancel anytime with Decline" });
}

export function tradeCompleteEmbed(
  summary: TradeExchangeSummary,
  senderName: string,
  receiverName: string,
): ReturnType<typeof campfireEmbed> {
  const senderLines = [`${String(summary.senderGives.coins)} coins`];
  senderLines.push(...itemLines(summary.senderGives.items));

  const receiverLines = [`${String(summary.receiverGives.coins)} coins`];
  receiverLines.push(...itemLines(summary.receiverGives.items));

  return campfireEmbed()
    .setTitle("Trade Complete")
    .setDescription("Both offers were exchanged. Happy hunting!")
    .addFields([
      {
        name: `${markup.bold(senderName)} gave`,
        value: senderLines.join("\n"),
        inline: false,
      },
      {
        name: `${markup.bold(receiverName)} gave`,
        value: receiverLines.join("\n"),
        inline: false,
      },
    ]);
}
