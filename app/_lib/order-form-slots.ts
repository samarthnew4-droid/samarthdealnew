export type OrderFormSlot = {
  dealType: string;
  availableSlots: number;
};

export type OrderFormSlotAvailability = {
  formUrl: string;
  slots: OrderFormSlot[];
};

export function getOrderFormPostStatus(
  availability: OrderFormSlotAvailability | null,
): "live" | "over" | null {
  if (!availability) return null;
  if (availability.slots.length === 0) return "over";
  return availability.slots.some((slot) => slot.availableSlots > 0)
    ? "live"
    : "over";
}

const jayShakthiOrderFormHost = "deal.jayshakthimarketing.com";
const requestTimeoutMs = 5_000;
const maximumResponseLength = 1_000_000;
const orderFormHtmlCacheMs = 10_000;

type OrderFormHtmlCacheEntry = {
  expiresAt: number;
  html?: string;
  request?: Promise<string | null>;
};

const orderFormHtmlCache = new Map<string, OrderFormHtmlCacheEntry>();

function decodeText(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&(?:apos|#0*39);/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)));
}

function normalizeUrl(value: string) {
  return decodeText(value)
    .replace(/\\([&()[\]])/g, "$1")
    .replace(/[.,!?;:]+$/, "")
    .replace(/[\])}*]+$/, "");
}

function isJayShakthiOrderForm(url: URL) {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const pathname = url.pathname.replace(/\/+$/, "");
  return url.protocol === "https:" && hostname === jayShakthiOrderFormHost && pathname === "/orderform";
}

export function getJayShakthiOrderFormUrl(description: string) {
  const normalizedDescription = decodeText(description);
  const candidates = normalizedDescription.match(/https?:\/\/[^\s<>"'`]+/gi) ?? [];

  for (const candidate of candidates) {
    const normalizedUrl = normalizeUrl(candidate);
    try {
      const url = new URL(normalizedUrl);
      if (isJayShakthiOrderForm(url)) return url.toString();
    } catch {
      // Keep looking; malformed links elsewhere in a message must not hide a valid order form.
    }
  }

  return null;
}

function plainTextFromHtml(html: string) {
  return decodeText(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  ).trim();
}

function slotCount(value: unknown) {
  const count = typeof value === "number" || typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

function slotsFromAvailableDeals(value: string): OrderFormSlot[] | null {
  try {
    const deals: unknown = JSON.parse(decodeText(value));
    if (!Array.isArray(deals)) return null;

    const seenDealTypes = new Set<string>();
    return deals.flatMap((deal) => {
      if (!deal || typeof deal !== "object") return [];
      const record = deal as { type_name?: unknown; remaining?: unknown };
      const dealType = typeof record.type_name === "string" ? record.type_name.replace(/\s+/g, " ").trim() : "";
      const availableSlots = slotCount(record.remaining);
      const normalizedDealType = dealType.toLowerCase();
      if (!dealType || availableSlots === null || seenDealTypes.has(normalizedDealType)) return [];
      seenDealTypes.add(normalizedDealType);
      return [{ dealType, availableSlots }];
    });
  } catch {
    return null;
  }
}

function attributeValue(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return match ? match[2] : "";
}

function matchesProductCode(option: string, productCode: string) {
  const optionCode = decodeText(attributeValue(option, "value"));
  if (optionCode === productCode) return true;

  try {
    return decodeURIComponent(productCode) === optionCode;
  } catch {
    return false;
  }
}

function slotsFromOrderFormOption(html: string, productCode: string) {
  for (const match of html.matchAll(/<option\b[^>]*>/gi)) {
    const option = match[0];
    if (!matchesProductCode(option, productCode)) continue;
    const availableDeals = attributeValue(option, "data-available-deals");
    return availableDeals ? slotsFromAvailableDeals(availableDeals) : null;
  }

  return null;
}

async function getOrderFormHtml(formUrl: string) {
  const cacheUrl = new URL(formUrl);
  cacheUrl.searchParams.delete("product_code");
  cacheUrl.searchParams.delete("deal_type_id");
  cacheUrl.hash = "";
  cacheUrl.searchParams.sort();
  const cacheKey = cacheUrl.toString();
  const cached = orderFormHtmlCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.request ?? cached.html ?? null;
  }

  const entry: OrderFormHtmlCacheEntry = {
    expiresAt: Date.now() + orderFormHtmlCacheMs,
  };
  entry.request = (async () => {
    try {
      const response = await fetch(formUrl, {
        cache: "no-store",
        headers: { "user-agent": "OrderOnline order-form slot checker/1.0" },
        redirect: "manual",
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
      if (!response.ok) return null;
      return (await response.text()).slice(0, maximumResponseLength);
    } catch {
      return null;
    }
  })();
  orderFormHtmlCache.set(cacheKey, entry);

  const html = await entry.request;
  if (orderFormHtmlCache.get(cacheKey) !== entry) return html;
  if (html === null) {
    orderFormHtmlCache.delete(cacheKey);
    return null;
  }

  orderFormHtmlCache.set(cacheKey, {
    expiresAt: Date.now() + orderFormHtmlCacheMs,
    html,
  });
  return html;
}

export function parseJayShakthiOrderFormSlots(html: string, productCode?: string): OrderFormSlot[] {
  if (productCode) {
    const optionSlots = slotsFromOrderFormOption(html, productCode);
    if (optionSlots !== null) return optionSlots;
  }

  const text = plainTextFromHtml(html);
  const availableSlotsMatch = /available\s+slots?\s*:?\s*/i.exec(text);
  if (!availableSlotsMatch) return [];

  const availableSlotsText = text.slice(availableSlotsMatch.index + availableSlotsMatch[0].length, availableSlotsMatch.index + availableSlotsMatch[0].length + 500);
  const seenDealTypes = new Set<string>();
  const slots: OrderFormSlot[] = [];

  for (const match of availableSlotsText.matchAll(/([A-Za-z][A-Za-z /_-]{0,48}?)\s*:\s*(\d+)\b/g)) {
    const dealType = match[1].replace(/\s+/g, " ").trim();
    const availableSlots = Number.parseInt(match[2], 10);
    const normalizedDealType = dealType.toLowerCase();

    if (!dealType || !Number.isSafeInteger(availableSlots) || seenDealTypes.has(normalizedDealType)) continue;
    seenDealTypes.add(normalizedDealType);
    slots.push({ dealType, availableSlots });
  }

  return slots;
}

export async function getJayShakthiOrderFormSlots(description: string): Promise<OrderFormSlotAvailability | null> {
  const formUrl = getJayShakthiOrderFormUrl(description);
  if (!formUrl) return null;

  try {
    const html = await getOrderFormHtml(formUrl);
    if (html === null) return null;

    const productCode = new URL(formUrl).searchParams.get("product_code") ?? undefined;
    const productSlots = productCode
      ? slotsFromOrderFormOption(html, productCode)
      : null;
    const slots = productSlots ?? parseJayShakthiOrderFormSlots(html, productCode);
    return productSlots !== null || slots.length > 0 ? { formUrl, slots } : null;
  } catch {
    // The product card remains usable when the external order-form site is unavailable.
    return null;
  }
}
