export const whatsappGroupLink =
  "https://chat.whatsapp.com/JMCUytJhLIV4dNTiCwxwVK?s=cl&p=a&iam=2";

const legacyGroupMarkdownLink =
  /\[https?:\/\/chat\.whatsapp\.com\/GR9V81zaR0226WSgCbN3wF[^\]\r\n]*\]\(https?:\/\/chat\.whatsapp\.com\/GR9V81zaR0226WSgCbN3wF[^)\r\n]*\)/gi;
const legacyGroupUrl =
  /https?:\/\/chat\.whatsapp\.com\/GR9V81zaR0226WSgCbN3wF[^\s<>"'`)\]]*/gi;

export function normalizeWhatsAppGroupLink(description: string) {
  return description
    .replace(legacyGroupMarkdownLink, whatsappGroupLink)
    .replace(legacyGroupUrl, whatsappGroupLink);
}
