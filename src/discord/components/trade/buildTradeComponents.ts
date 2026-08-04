import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { encodeComponentState } from "#src/discord/components/componentState.js";
import type { TradeState } from "#src/game/services/tradeService.js";

export const TRADE_PREFIX = "trade";
export const TRADE_ACCEPT = "accept";
export const TRADE_DECLINE = "decline";
export const TRADE_ADD = "add";
export const TRADE_REMOVE = "remove";
export const TRADE_COINS = "coins";
export const TRADE_ADD_ITEM = "add_item";
export const TRADE_REMOVE_ITEM = "remove_item";
export const TRADE_ITEM_MODAL = "item_modal";

export function tradeAcceptId(tradeId: string): string {
  return encodeComponentState([TRADE_PREFIX, TRADE_ACCEPT, tradeId]);
}

export function tradeDeclineId(tradeId: string): string {
  return encodeComponentState([TRADE_PREFIX, TRADE_DECLINE, tradeId]);
}

export function tradeAddId(tradeId: string): string {
  return encodeComponentState([TRADE_PREFIX, TRADE_ADD, tradeId]);
}

export function tradeRemoveId(tradeId: string): string {
  return encodeComponentState([TRADE_PREFIX, TRADE_REMOVE, tradeId]);
}

export function tradeCoinsId(tradeId: string, delta: number): string {
  return encodeComponentState([TRADE_PREFIX, TRADE_COINS, delta, tradeId]);
}

export function tradeAddItemId(tradeId: string): string {
  return encodeComponentState([TRADE_PREFIX, TRADE_ADD_ITEM, tradeId]);
}

export function tradeRemoveItemId(tradeId: string): string {
  return encodeComponentState([TRADE_PREFIX, TRADE_REMOVE_ITEM, tradeId]);
}

export function tradeItemModalId(
  tradeId: string,
  kind: "add" | "remove",
): string {
  return encodeComponentState([TRADE_PREFIX, TRADE_ITEM_MODAL, kind, tradeId]);
}

function tradeButton(
  customId: string,
  label: string,
  style: ButtonStyle,
  disabled: boolean,
): ButtonBuilder {
  return new ButtonBuilder({ customId, label, style, disabled });
}

export function buildTradeActionRows(
  state: TradeState,
): ActionRowBuilder<ButtonBuilder>[] {
  const { trade } = state;
  const open =
    (trade.status === "pending" || trade.status === "accepted") &&
    trade.expires_at.getTime() > Date.now();

  if (trade.status === "pending") {
    return [
      new ActionRowBuilder<ButtonBuilder>({
        components: [
          tradeButton(
            tradeAcceptId(trade.id),
            "Accept Trade",
            ButtonStyle.Success,
            !open,
          ),
          tradeButton(
            tradeDeclineId(trade.id),
            "Decline",
            ButtonStyle.Danger,
            !open,
          ),
        ],
      }),
    ];
  }

  const controls = new ActionRowBuilder<ButtonBuilder>({
    components: [
      tradeButton(
        tradeCoinsId(trade.id, 10),
        "+10 Coins",
        ButtonStyle.Secondary,
        !open,
      ),
      tradeButton(
        tradeCoinsId(trade.id, -10),
        "-10 Coins",
        ButtonStyle.Secondary,
        !open,
      ),
      tradeButton(
        tradeAddId(trade.id),
        "Add Items",
        ButtonStyle.Primary,
        !open,
      ),
      tradeButton(
        tradeRemoveId(trade.id),
        "Remove Item",
        ButtonStyle.Primary,
        !open,
      ),
    ],
  });

  const decisions = new ActionRowBuilder<ButtonBuilder>({
    components: [
      tradeButton(
        tradeAcceptId(trade.id),
        "Confirm Trade",
        ButtonStyle.Success,
        !open,
      ),
      tradeButton(
        tradeDeclineId(trade.id),
        "Decline",
        ButtonStyle.Danger,
        !open,
      ),
    ],
  });

  return [controls, decisions];
}
