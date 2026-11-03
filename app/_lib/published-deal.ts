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
  external_order_url: string | null;
  mediator_name: string | null;
  order_form_url: string | null;
  refund_form_url: string | null;
  tracking_url: string | null;
  total_slots: number | null;
  available_slots: number | null;
  status: string;
  rules: string | null;
  remarks: string | null;
  created_at: string | null;
  description?: string | null;
  product: SupabaseProduct | SupabaseProduct[] | null;
};

export type PublishedDeal = Omit<SupabaseDealRow, "product"> & {
  product: SupabaseProduct | null;
};

export async function getPublishedDeal(id: string): Promise<PublishedDeal | null> {
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
          external_order_url,
          mediator_name,
          order_form_url,
          refund_form_url,
          tracking_url,
          total_slots,
          available_slots,
          status,
          rules,
          remarks,
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
      .eq("id", id)
      .in("status", ["live", "over"])
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const row = data as unknown as SupabaseDealRow;

    return {
      ...row,
      description: row.description ?? null,
      product: Array.isArray(row.product) ? row.product[0] ?? null : row.product,
    };
  } catch (error) {
    console.error("Unable to load published deal from Supabase.", error);
    return null;
  }
}