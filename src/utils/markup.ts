export const markup = {
  bold: (text: string): string => `**${text}**`,
  italic: (text: string): string => `_${text}_`,
  inline: (text: string): string => `\`${text}\``,
};
