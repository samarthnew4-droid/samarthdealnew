import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { removeProductImage } from "../../../_lib/product-image-storage";

export const dynamic = "force-dynamic";

function hasValidCronSecret(request: Request, cronSecret: string) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization === cronSecret || authorization === "Bearer " + cronSecret;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !hasValidCronSecret(request, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
  if (!supabaseUrl || !serviceRoleKey || !storageBucket) {
    return NextResponse.json({ error: "Cleanup is not configured." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 4);
  const { data: posts, error: lookupError } = await supabase
    .from("product_posts")
    .select("id, image_url")
    .lte("published_at", cutoff.toISOString());
  if (lookupError) {
    return NextResponse.json({ error: "Unable to load expired product posts." }, { status: 500 });
  }

  let deleted = 0;
  for (const post of posts ?? []) {
    const imageError = await removeProductImage(supabase, post.image_url, storageBucket);
    if (imageError) continue;
    const { error: deleteError } = await supabase.from("product_posts").delete().eq("id", post.id);
    if (!deleteError) deleted += 1;
  }

  return NextResponse.json({ deleted });
}
