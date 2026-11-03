import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDate, formatPrice } from "../../_lib/formatters";
import { getPublishedDeal } from "../../_lib/published-deal";

export const dynamic = "force-dynamic";

function OptionalLink({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 break-all text-sm font-semibold text-slate-950">
        <a className="underline decoration-slate-300 underline-offset-4 hover:decoration-slate-950" href={value} rel="noreferrer" target="_blank">
          {value}
        </a>
      </dd>
    </div>
  );
}

function OptionalValue({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

export default async function DealDetailPage({ params }: PageProps<"/deals/[id]">) {
  const { id } = await params;
  const deal = await getPublishedDeal(id);

  if (!deal) {
    notFound();
  }

  const product = deal.product;
  const isOver = deal.status.toLowerCase() === "over";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link className="text-sm font-bold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950 hover:decoration-slate-950" href="/">
          ← Back to deals
        </Link>

        <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mt-8">
          <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
            <div className="flex min-h-64 items-center justify-center border-b border-slate-200 bg-slate-100 p-6 lg:min-h-full lg:border-b-0 lg:border-r">
              {product?.image_url ? (
                <img alt={product.name} className="max-h-96 w-full object-contain" src={product.image_url} />
              ) : (
                <div className="text-center text-sm font-semibold text-slate-500">Product image unavailable</div>
              )}
            </div>

            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">{deal.deal_type || "Deal"}</p>
                  <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{product?.name || "Product unavailable"}</h1>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-extrabold tracking-[0.1em] ${isOver ? "bg-slate-100 text-slate-700 ring-slate-600/20" : "bg-emerald-50 text-emerald-700 ring-emerald-600/20"} ring-1 ring-inset`}>
                  {isOver ? "OVER" : "LIVE"}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 border-y border-slate-100 py-5">
                <div>
                  <p className="text-xs text-slate-500">Order price</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{formatPrice(deal.order_price)}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Less price</p>
                  <p className="mt-1 text-3xl font-black text-emerald-700">{formatPrice(deal.less_price)}</p>
                </div>
              </div>

              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Available slots</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-950">
                    {deal.available_slots != null && deal.total_slots != null ? `${deal.available_slots} / ${deal.total_slots}` : "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Posted</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-950">{formatDate(deal.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Brand</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-950">{product?.brand || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Product code</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-950">{product?.product_code || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Platform</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-950">{deal.platform || "Not provided"}</dd>
                </div>
              </dl>

              {deal.description && (
                <section className="mt-6 border-t border-slate-100 pt-5">
                  <h2 className="text-lg font-black text-slate-950">Product details</h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{deal.description}</p>
                </section>
              )}
            </div>
          </div>

          <div className="grid gap-8 border-t border-slate-200 p-5 sm:p-8 lg:grid-cols-2">
            <section>
              <h2 className="text-lg font-black text-slate-950">Order information</h2>
              <dl className="mt-4 grid gap-4">
                <OptionalLink label="External order link" value={deal.external_order_url} />
                <OptionalValue label="Mediator" value={deal.mediator_name} />
                <OptionalLink label="Order form" value={deal.order_form_url} />
                <OptionalLink label="Refund form" value={deal.refund_form_url} />
                <OptionalLink label="Tracking" value={deal.tracking_url} />
              </dl>
            </section>

            <section className="grid gap-6">
              {deal.rules && (
                <div>
                  <h2 className="text-lg font-black text-slate-950">Rules</h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{deal.rules}</p>
                </div>
              )}
              {deal.remarks && (
                <div>
                  <h2 className="text-lg font-black text-slate-950">Remarks</h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{deal.remarks}</p>
                </div>
              )}
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}