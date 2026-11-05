import {
  getJayShakthiOrderFormSlots,
  getJayShakthiOrderFormUrl,
} from "../../_lib/order-form-slots";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const requestedUrl = new URL(request.url).searchParams.get("url");

  if (
    !requestedUrl ||
    requestedUrl.length > 2048 ||
    !getJayShakthiOrderFormUrl(requestedUrl)
  ) {
    return Response.json(
      { error: "A supported order-form URL is required." },
      { status: 400 },
    );
  }

  const slots = await getJayShakthiOrderFormSlots(requestedUrl);

  return Response.json(
    { slots },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
