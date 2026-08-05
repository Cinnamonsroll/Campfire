import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  type APIMessageTopLevelComponent,
  type JSONEncodable,
} from "discord.js";
import { IS_COMPONENTS_V2 } from "../../constants.js";
import {
  SHOP_BUY_PREFIX,
  SHOP_CANCEL_PREFIX,
  SHOP_SELECT_PREFIX,
} from "../../customIds.js";
import { encodeComponentState } from "../componentState.js";
import { CAMPFIRE_ORANGE } from "../../../embeds/base.js";
import { markup } from "../../../utils/markup.js";
import type { ShopItemView, ShopView } from "../../../game/services/shop/index.js";

interface ShopComponentPayload {
  readonly components: JSONEncodable<APIMessageTopLevelComponent>[];
  readonly flags: number;
}

interface ShopPending {
  itemKey: string;
}

const SHOP_CARD_ATTACHMENT = "attachment://shop_card.png";

function itemLine(item: ShopItemView): string {
  const stockLabel =
    item.remaining > 0 ? `${String(item.remaining)} left` : "sold out";
  return `${item.entry.emoji} ${markup.bold(item.entry.name)} · ${String(item.entry.price)} coins (${stockLabel})`;
}

function buildSelectRow(
  shop: ShopView,
  available: readonly ShopItemView[],
): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>({
    components: [
      new StringSelectMenuBuilder()
        .setCustomId(encodeComponentState([SHOP_SELECT_PREFIX, shop.date]))
        .setPlaceholder("Pick something to buy")
        .addOptions(
          available.map((item) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(item.entry.name)
              .setValue(item.entry.key)
              .setEmoji(item.entry.emoji)
              .setDescription(
                `${String(item.entry.price)} coins · ${String(item.remaining)} left`,
              ),
          ),
        ),
    ],
  });
}

export function buildShopPayload(
  shop: ShopView,
  pending?: ShopPending | null,
  notice?: string | null,
): ShopComponentPayload {
  const container = new ContainerBuilder().setAccentColor(CAMPFIRE_ORANGE);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `🏪 ${markup.bold("Camp General Store")}`,
    ),
    new TextDisplayBuilder().setContent(
      `Fresh supplies arrived this morning.\n${shop.refreshLabel} · 🪙 ${String(shop.coins)} coins`,
    ),
  );

  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder()
        .setURL(SHOP_CARD_ATTACHMENT)
        .setDescription("The camp general store shelves"),
    ),
  );

  container.addSeparatorComponents(new SeparatorBuilder());

  if (notice) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(notice),
    );
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(markup.bold("🛒 On the shelf")),
    new TextDisplayBuilder().setContent(shop.items.map(itemLine).join("\n")),
  );

  const available = shop.items.filter((item) => item.remaining > 0);
  const pendingItem = pending
    ? shop.items.find((item) => item.entry.key === pending.itemKey)
    : undefined;

  if (pendingItem) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `Ready to buy ${pendingItem.entry.emoji} ${markup.bold(pendingItem.entry.name)} for ${String(pendingItem.entry.price)} coins?`,
      ),
    );
  }

  if (available.length > 0) {
    container.addActionRowComponents(buildSelectRow(shop, available));
  } else {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        markup.italic(
          "Everything's sold out for today. New stock at midnight.",
        ),
      ),
    );
  }

  if (pendingItem) {
    container.addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>({
        components: [
          new ButtonBuilder()
            .setCustomId(
              encodeComponentState([
                SHOP_BUY_PREFIX,
                shop.date,
                pendingItem.entry.key,
              ]),
            )
            .setLabel("Confirm")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(encodeComponentState([SHOP_CANCEL_PREFIX, shop.date]))
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary),
        ],
      }),
    );
  }

  return { components: [container], flags: IS_COMPONENTS_V2 };
}

export function buildShopNoticePayload(content: string): ShopComponentPayload {
  return {
    components: [
      new ContainerBuilder()
        .setAccentColor(CAMPFIRE_ORANGE)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content)),
    ],
    flags: IS_COMPONENTS_V2,
  };
}
