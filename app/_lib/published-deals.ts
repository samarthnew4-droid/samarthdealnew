import type { Deal, DealStatus, DealVisual } from "./deals";
import { createPublicSupabaseClient } from "./supabase";

type SupabaseProduct = {
  id: string;
  name: string;
  brand: string | null;
  product_code: string | null;
  image_url: string | null;
};

type SupabaseDealRow = {
  id: string;
  deal_type: string | null;
  platform: string | null;
  order_price: number | string | null;
  less_price: number | string | null;
  status: string;
  created_at: string | null;
  description?: string | null;
  product: SupabaseProduct | SupabaseProduct[] | null;
};

export type PublishedDealsResult =
  | { deals: Deal[]; errorMessage: null }
  | { deals: Deal[]; errorMessage: string };

const visualOptions: DealVisual[] = ["audio", "mobile", "kitchen", "gaming", "home", "travel"];

function toCurrencyAmount(value: number | string | null) {
  const amount = Number(value);

  return Number.isFinite(amount) ? amount : 0;
}

function toDealStatus(status: string): DealStatus {
  return status.toLowerCase() === "over" ? "OVER" : "LIVE";
}

function selectPlaceholderVisual(id: string) {
  const characterTotal = [...id].reduce((total, character) => total + character.charCodeAt(0), 0);

  return visualOptions[characterTotal % visualOptions.length];
}

function mapDeal(row: SupabaseDealRow): Deal | null {
  const product = Array.isArray(row.product) ? row.product[0] : row.product;

  if (!product) {
    return null;
  }

  return {
    id: row.id,
    slug: product.product_code || product.id,
    productName: product.name,
    brand: product.brand || "Unknown brand",
    imageUrl: product.image_url,
    description: row.description ?? null,
    dealType: row.deal_type || "Deal",
    orderPrice: toCurrencyAmount(row.order_price),
    finalPrice: toCurrencyAmount(row.less_price),
    platform: row.platform || "Unknown platform",
    status: toDealStatus(row.status),
    postedAt: row.created_at,
    visual: selectPlaceholderVisual(product.id),
  };
}

export async function getPublishedDeals(): Promise<PublishedDealsResult> {
  try {
    const supabase = createPublicSupabaseClient();
    const { error: descriptionError } = await supabase.from("deals").select("description").limit(0);
    const descriptionField = descriptionError ? "" : "description,";
    // The selected columns vary only because description may not exist before migration.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryClient = supabase as any;
    const { data, error } = await queryClient
      .from("deals")
      .select(
        `${descriptionField}
          id,
          deal_type,
          platform,
          order_price,
          less_price,
          status,
          created_at,
          product:products!product_id (
            id,
            name,
            brand,
            product_code,
            image_url
          )
        `,
      )
      .in("status", ["live", "over"])
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const deals = (data as unknown as SupabaseDealRow[]).flatMap((row) => {
      const deal = mapDeal(row);
      return deal ? [deal] : [];
    });

    return { deals, errorMessage: null };
  } catch (error) {
    console.error("Unable to load published deals from Supabase.", error);
    return {
      deals: [],
      errorMessage: "We could not load live deals right now. Please try again shortly.",
    };
  }
}
