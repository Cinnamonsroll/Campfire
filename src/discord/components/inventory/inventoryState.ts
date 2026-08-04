import { encodeComponentState } from "#src/discord/components/componentState.js";

const INVENTORY_NAMESPACE = "inventory";

const FILTER_ACTION = "filter";

export const FILTER_SELECT_CUSTOM_ID = encodeComponentState([
  INVENTORY_NAMESPACE,
  FILTER_ACTION,
]);
