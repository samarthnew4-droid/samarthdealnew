import { createPublicSupabaseClient } from "./supabase.ts";
import {
  getJayShakthiOrderFormSlots,
  getJayShakthiOrderFormUrl,
  type OrderFormSlotAvailability,
} from "./order-form-slots.ts";
import {
  cleanProductTitle,
  isValidProductName,
  nullablePrice,
  parseProductPostMessage,
} from "./product-post-parser.ts";
import { firstProductOrderLink } from "./product-links.ts";

export type ProductPost = {
  id: string;
  image_url: string;
  description: string;
  product_name: string | null;
  brand: string | null;
  platform: string | null;
  order_price: number | string | null;
  less_price: number | string | null;
  rating: number | string | null;
  serial_number: number | null;
  published_at: string | null;
  status: "live" | "over";
  created_at: string;
  updated_at: string;
  order_form_url: string | null;
  order_form_slots: OrderFormSlotAvailability | null;
};

export type ProductPostsResult = {
  posts: ProductPost[];
  errorMessage: string | null;
};

const baseSelect =
  "id, image_url, description, status, created_at, updated_at";
const baseSelectWithSerial =
  `${baseSelect}, serial_number`;

const metadataSelect =
  "id, image_url, description, product_name, brand, platform, order_price, less_price, status, created_at, updated_at, serial_number";
type SupabaseQueryError = {
  code?: string;
  message?: string;
} | null;

function missingOptionalProductPostSchema(
  error: SupabaseQueryError,
) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "PGRST204" ||
    error?.code === "PGRST205" ||
    error?.code === "42P01" ||
    message.includes("product_name") ||
    message.includes("published_at") ||
    message.includes("rating") ||
    message.includes("serial_number") ||
    (message.includes("relation") &&
      message.includes("product_posts"))
  );
}

async function normalizePost(
  row: Record<string, unknown>,
  options: {
    includeOrderFormSlots?: boolean;
  } = {},
): Promise<ProductPost> {
  const description = String(row.description);

  const parsed = parseProductPostMessage(description);

  const productLink = firstProductOrderLink(description);
  const brandCandidate =
    typeof row.brand === "string"
      ? cleanProductTitle(row.brand)
      : "";
  const validBrand = isValidProductName(brandCandidate)
    ? brandCandidate
    : null;

  const storedLessPrice =
    typeof row.less_price === "number" ||
    typeof row.less_price === "string"
      ? row.less_price
      : null;

  return {
    id: String(row.id),

    serial_number: validSerialNumber(row.serial_number),

    image_url: String(row.image_url),

    description,

    product_name: null,

    brand:
      validBrand || null,

    platform:
      productLink?.platform ||
      (typeof row.platform === "string" ? row.platform : "") ||
      parsed.platform ||
      null,

    order_price:
      nullablePrice(parsed.orderPrice) ??
      (typeof row.order_price === "number" ||
      typeof row.order_price === "string"
        ? row.order_price
        : null),

    less_price:
      nullablePrice(parsed.lessPrice) ?? storedLessPrice,

    rating: validRating(row.rating),

    published_at:
      typeof row.published_at === "string"
        ? row.published_at
        : null,

    status:
      row.status === "over"
        ? "over"
        : "live",

    created_at: String(row.created_at),

    updated_at: String(row.updated_at),

    order_form_url: getJayShakthiOrderFormUrl(description),

    order_form_slots: options.includeOrderFormSlots
      ? await getJayShakthiOrderFormSlots(description)
      : null,
  };
}

function validSerialNumber(value: unknown) {
  const serialNumber =
    typeof value === "number" || typeof value === "string"
      ? Number(value)
      : Number.NaN;

  return Number.isSafeInteger(serialNumber) && serialNumber > 0
    ? serialNumber
    : null;
}

function validRating(value: unknown) {
  const rating =
    typeof value === "number" ||
    typeof value === "string"
      ? Number(value)
      : NaN;

  return Number.isFinite(rating) &&
    rating >= 0 &&
    rating <= 5
    ? rating
    : null;
}

export async function getPublishedProductPosts(): Promise<ProductPostsResult> {
  try {
    const supabase =
      createPublicSupabaseClient();

    const primary = await supabase
      .from("product_posts")
      .select(metadataSelect)
      .in("status", ["live", "over"])
      .order("created_at", {
        ascending: false,
      });

    let rows: unknown[] =
      (primary.data ?? []) as unknown[];

    let error =
      primary.error as SupabaseQueryError;

    if (
      error &&
      missingOptionalProductPostSchema(error)
    ) {
      const fallbackWithSerial = await supabase
        .from("product_posts")
        .select(baseSelectWithSerial)
        .in("status", ["live", "over"])
        .order("created_at", {
          ascending: false,
        });
      rows = (fallbackWithSerial.data ?? []) as unknown[];
      error = fallbackWithSerial.error as SupabaseQueryError;
      if (error && missingOptionalProductPostSchema(error)) {
        const legacyFallback = await supabase
          .from("product_posts")
          .select(baseSelect)
          .in("status", ["live", "over"])
          .order("created_at", {
            ascending: false,
          });
        rows = (legacyFallback.data ?? []) as unknown[];
        error = legacyFallback.error as SupabaseQueryError;
      }
    }

    if (error) {
      return {
        posts: [],
        errorMessage: "We could not load live deals right now. Please try again shortly.",
      };
    }

    return {
      posts: await Promise.all(
        rows.map((row) =>
          normalizePost(
            row as Record<string, unknown>,
          ),
        ),
      ),
      errorMessage: null,
    };
  } catch (error) {
    console.error("Unable to load live product posts.", error);
    return {
      posts: [],
      errorMessage: "We could not load live deals right now. Please try again shortly.",
    };
  }
}

export async function getPublishedProductPost(
  id: string,
): Promise<ProductPost | null> {
  try {
    const supabase =
      createPublicSupabaseClient();

    const primary = await supabase
      .from("product_posts")
      .select(metadataSelect)
      .eq("id", id)
      .in("status", ["live", "over"])
      .maybeSingle();

    let row: unknown | null =
      primary.data as unknown | null;

    let error =
      primary.error as SupabaseQueryError;

    if (
      error &&
      missingOptionalProductPostSchema(error)
    ) {
      const fallbackWithSerial = await supabase
        .from("product_posts")
        .select(baseSelectWithSerial)
        .eq("id", id)
        .in("status", ["live", "over"])
        .maybeSingle();
      row = fallbackWithSerial.data as unknown | null;
      error = fallbackWithSerial.error as SupabaseQueryError;
      if (error && missingOptionalProductPostSchema(error)) {
        const legacyFallback = await supabase
          .from("product_posts")
          .select(baseSelect)
          .eq("id", id)
          .in("status", ["live", "over"])
          .maybeSingle();
        row = legacyFallback.data as unknown | null;
        error = legacyFallback.error as SupabaseQueryError;
      }
    }

    return error || !row
      ? null
      : await normalizePost(row as Record<string, unknown>, {
          includeOrderFormSlots: true,
        });
  } catch {
    return null;
  }
}