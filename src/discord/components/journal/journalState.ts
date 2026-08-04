import { encodeComponentState } from "#/discord/components/componentState.js";

const JOURNAL_NAMESPACE = "journal";

const FILTER_ACTION = "filter";

export const FILTER_SELECT_CUSTOM_ID = encodeComponentState([
  JOURNAL_NAMESPACE,
  FILTER_ACTION,
]);
