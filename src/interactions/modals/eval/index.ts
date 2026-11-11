import type { ModalHandler } from "../../../types/index.js";
import { replyToEvaluation } from "../../../utils/evalReply.js";

const handle: ModalHandler = async (interaction) => {
  const [, rawDepth, remote, language, highlight] =
    interaction.customId.split("|");
  const depth = Number(rawDepth);
  await replyToEvaluation(
    { interaction },
    {
      code: interaction.fields.getTextInputValue("code"),
      depth: Number.isInteger(depth) && depth >= 0 && depth <= 10 ? depth : 0,
      remote: remote === "1",
      language: language || "js",
      highlight: highlight || undefined,
    },
  );
};
export default new Map<string, ModalHandler>([["eval", handle]]);
