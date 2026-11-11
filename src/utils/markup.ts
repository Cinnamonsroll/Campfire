export const markup = {
  codeblock: (text: string, language = ""): string => {
    const safeLanguage = language.replace(/[^a-zA-Z0-9_+-]/g, "").slice(0, 32);
    const safeText = text
      .replace(/`(?!\u200b)/g, "`\u200b")
      .replace(/@(?!\u200b)/g, "@\u200b");
    return `\`\`\`${safeLanguage}\n${safeText || "\u200b"}\n\`\`\``;
  },
  bold: (text: string): string => `**${text}**`,
  italic: (text: string): string => `_${text}_`,
  inline: (text: string): string => `\`${text}\``,
};
