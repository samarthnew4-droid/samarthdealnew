import { createSupabaseServerClient } from "./supabase-server";

type AdminProduct = {
  id: string;
  name: string | null;
  brand: string | null;
  product_code: string | null;
  image_url: string | null;
};

type AdminDealRow = {
  id: string;
  product_id: string;
  deal_type: string | null;
  platform: string | null;
  order_price: number | string | null;
  less_price: number | string | null;
  total_slots: number | null;
  available_slots: number | null;
  status: string | null;
  external_order_url: string | null;
  mediator_name: string | null;
  order_form_url: string | null;
  refund_form_url: string | null;
  tracking_url: string | null;
  rules: string | null;
  remarks: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string | null;
  description?: string | null;
  product: AdminProduct | AdminProduct[] | null;
};

export type AdminDeal = Omit<AdminDealRow, "product"> & {
  product: AdminProduct | null;
};

export type AdminDealsResult =
  | { deals: AdminDeal[]; errorMessage: null }
  | { deals: AdminDeal[]; errorMessage: string };

export async function getAdminDeals(): Promise<AdminDealsResult> {
  try {
    const supabase = await createSupabaseServerClient();
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
          product_id,
          deal_type,
          platform,
          order_price,
          less_price,
          total_slots,
          available_slots,
          status,
          external_order_url,
          mediator_name,
          order_form_url,
          refund_form_url,
          tracking_url,
          rules,
          remarks,
          start_time,
          end_time,
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
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const deals = ((data ?? []) as AdminDealRow[]).map((deal) => ({
      ...deal,
      product: Array.isArray(deal.product) ? deal.product[0] ?? null : deal.product,
    }));

    return { deals, errorMessage: null };
  } catch (error) {
    console.error("Unable to load admin deals from Supabase.", error instanceof Error ? error.message : "Unknown error");

    return {
      deals: [],
      errorMessage: "We could not load the deals right now. Please try again shortly.",
    };
  }
}