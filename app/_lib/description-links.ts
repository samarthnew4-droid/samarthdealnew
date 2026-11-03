export type DescriptionPart =
  | { kind: "text"; value: string }
  | {
      kind: "link";
      label: string;
      url: string;
      actionLabel: string | null;
    };

type LinkMatch = {
  index: number;
  length: number;
  label: string;
  url: string;
};

const markdownLinkPattern = /\[([^\]\r\n]+)\]\((https?:\/\/[^\s)]+)\)/i;
const plainUrlPattern = /https?:\/\/[^\s<>"'`]+/i;
const trailingUrlPunctuation = /[.,!?;:]+$/;

function safeHttpUrl(value: string) {
  try {
    // WhatsApp-formatted messages commonly escape ampersands in Markdown link destinations.
    const normalized = value.replace(/\\([&()[\]])/g, "$1");
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:" ? normalized : null;
  } catch {
    return null;
  }
}

function trimPlainUrl(value: string) {
  let trimmed = value.replace(trailingUrlPunctuation, "");

  while (/[)\]}]$/.test(trimmed)) {
    const openingCount = (trimmed.match(/[(\[]/g) ?? []).length;
    const closingCount = (trimmed.match(/[)\]]/g) ?? []).length;
    if (closingCount <= openingCount) break;
    trimmed = trimmed.slice(0, -1);
  }

  return trimmed;
}

function findNextLink(value: string, start: number): LinkMatch | null {
  const remaining = value.slice(start);
  const markdownMatch = remaining.match(markdownLinkPattern);
  const plainMatch = remaining.match(plainUrlPattern);
  const markdownIndex = markdownMatch?.index ?? Number.POSITIVE_INFINITY;
  const plainIndex = plainMatch?.index ?? Number.POSITIVE_INFINITY;

  if (!markdownMatch && !plainMatch) {
    return null;
  }

  if (markdownMatch && markdownIndex <= plainIndex) {
    const url = safeHttpUrl(markdownMatch[2]);
    return url
      ? {
          index: start + markdownIndex,
          length: markdownMatch[0].length,
          label: markdownMatch[1],
          url,
        }
      : findNextLink(value, start + markdownIndex + 1);
  }

  const rawUrl = plainMatch?.[0] ?? "";
  const url = safeHttpUrl(trimPlainUrl(rawUrl));
  if (!url || !plainMatch) {
    return findNextLink(value, start + plainIndex + 1);
  }

  return {
    index: start + plainIndex,
    length: url.length,
    label: url,
    url,
  };
}

function getActionLabel(url: string, context: string) {
  const searchable = `${url} ${context}`.toLowerCase();

  if (searchable.includes("whatsapp")) return "Join WhatsApp";
  if (/\/refundform(?:[/?#]|$)/i.test(url)) return "Open refund form";
  if (/\/orderform(?:[/?#]|$)/i.test(url)) return "Open order form";
  if (/\/(?:customer|track|tracking)(?:[/?#]|$)/i.test(url)) return "Track order";
  if (/\border\s+link\b/.test(context.toLowerCase()) || /bitly\.in\//i.test(url)) return "Open product";
  if (/\brefund\b/.test(searchable)) return "Open refund form";
  if (/\b(order|form)\b/.test(searchable) || searchable.includes("forms.gle")) return "Open order form";
  if (/\b(track|tracking|status)\b/.test(searchable)) return "Track order";
  if (/\b(amazon|flipkart|myntra|meesho|ajio|nykaa|product)\b/.test(searchable)) return "Open product";

  return null;
}

export function descriptionActionLabel(url: string, context = "") {
  return getActionLabel(url, context);
}

export function tokenizeDescription(description: string): DescriptionPart[] {
  const parts: DescriptionPart[] = [];
  let cursor = 0;

  while (cursor < description.length) {
    const match = findNextLink(description, cursor);
    if (!match) {
      parts.push({ kind: "text", value: description.slice(cursor) });
      break;
    }

    if (match.index > cursor) {
      parts.push({ kind: "text", value: description.slice(cursor, match.index) });
    }

    parts.push({
      kind: "link",
      label: match.label,
      url: match.url,
      actionLabel: getActionLabel(match.url, description.slice(Math.max(0, match.index - 80), match.index)),
    });
    cursor = match.index + match.length;
  }

  return parts.length > 0 ? parts : [{ kind: "text", value: description }];
}
