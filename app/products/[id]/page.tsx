import Link from "next/link";
import { notFound } from "next/navigation";

import BrandWordmark from "../../_components/brand-wordmark";
import { tokenizeDescription } from "../../_lib/description-links";
import { extractDealInformation } from "../../_lib/deal-detail";
import { formatDate, formatPrice } from "../../_lib/formatters";
import { getPublishedProductPost } from "../../_lib/product-posts";
import { firstProductOrderLink, isAmazonPlatform } from "../../_lib/product-links";
import { numericPrice } from "../../_lib/pricing";
import { whatsappGroupLink } from "../../_lib/whatsapp-group-link";

export const dynamic = "force-dynamic";

const mandatoryJoinNotice = `____________________________
MANDATORY to Join this For Fast
PAYMENT UPDATES & REGULAR RATTING Deals
${whatsappGroupLink}

Mediator: Samarth`;

export default async function ProductPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPublishedProductPost(id);

  if (!post) notFound();

  const orderPrice = numericPrice(post.order_price);
  const lessPrice = numericPrice(post.less_price);
  const isLive = post.status === "live";
  const dealInformation = extractDealInformation(post.description);
  const productLink = firstProductOrderLink(post.description);
  const platformName = post.platform?.trim() || productLink?.platform || "Platform not specified";
  const isAmazon =
    isAmazonPlatform(platformName) || isAmazonPlatform(productLink?.platform);
  const originalCaption = post.description.trimEnd();
  const caption = originalCaption ? `${originalCaption}\n\n${mandatoryJoinNotice}` : mandatoryJoinNotice;
  const captionParts = tokenizeDescription(caption);
  const hasGroupLink = /https?:\/\/chat\.whatsapp\.com\//i.test(post.description);
  const hasMediator = /^\s*mediator(?:\s+name)?\s*[:-]/im.test(post.description);
  const whatsappUrl = new URL("https://wa.me/917588424031");
  whatsappUrl.searchParams.set("text", caption);
  return (
    <main className="min-h-screen bg-[#f4f5f9] px-3 py-4 text-slate-950 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link aria-label="Samarth Deals home" className="mb-3 block w-full max-w-[440px]" href="/">
          <BrandWordmark className="block h-auto w-full" />
        </Link>
        <Link className="inline-flex min-h-10 items-center text-sm font-bold text-slate-600 transition hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/10" href="/">
          <span aria-hidden="true" className="mr-2">←</span> Back to deals
        </Link>
        <article className="mt-4 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 sm:mt-8">
          <div className="relative flex min-h-64 items-center justify-center bg-gradient-to-br from-slate-100 via-[#f8f7fb] to-[#eef5f5] p-5 sm:min-h-[34rem] sm:p-8">
            <img alt="Product image" className="max-h-[32rem] w-full object-contain" src={post.image_url} />
            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black text-slate-800">#{post.serial_number ?? "—"}</span>
              <span className={`rounded-full px-3 py-1.5 text-[10px] font-black tracking-[0.13em] ${isLive ? "bg-emerald-500 text-white" : "bg-slate-800 text-white"}`}>{isLive ? "LIVE" : "OVER"}</span>
              {!isAmazon && (
                <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black text-slate-800">{platformName}</span>
              )}
              {productLink && !isAmazon && (
                <a
                  aria-label={`Open ${platformName} product link`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-sm"
                  href={productLink.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  🔥
                </a>
              )}
            </div>
          </div>
          <div className="min-w-0 p-4 sm:p-10">
            {(orderPrice !== null || lessPrice !== null) && <dl className="mt-0 grid grid-cols-2 gap-2 border-y border-slate-100 py-4 sm:mt-0 sm:gap-3 sm:py-5 sm:grid-cols-3">
              {orderPrice !== null && <div className="min-w-0 rounded-2xl bg-slate-50 p-3 sm:p-4"><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">Order price</dt><dd className="mt-2 break-words text-xl font-black sm:text-2xl">{formatPrice(orderPrice)}</dd></div>}
              {lessPrice !== null && <div className="min-w-0 rounded-2xl bg-emerald-50 p-3 sm:p-4"><dt className="text-[10px] font-black uppercase tracking-wide text-emerald-700 sm:text-xs">Less price</dt><dd className="mt-2 break-words text-2xl font-black text-emerald-700 sm:text-3xl">{formatPrice(lessPrice)}</dd></div>}
            </dl>}
            <section className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-black text-slate-950">Original deal details</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {!hasMediator && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Mediator</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{dealInformation.mediator ?? "Samarth"}</dd></div>}
                {!hasGroupLink && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">WhatsApp group</dt><dd className="mt-1 text-sm font-semibold"><a className="text-emerald-700 underline underline-offset-2" href={whatsappGroupLink} rel="noopener noreferrer" target="_blank">Join the group</a></dd></div>}
              </dl>
              <a
                className="mt-4 flex min-h-14 w-full items-center justify-center rounded-full bg-[#25D366] px-5 text-center text-sm font-black tracking-wide text-white shadow-md transition hover:bg-[#1da851] focus:outline-none focus:ring-4 focus:ring-emerald-500/25 sm:min-h-16 sm:text-base"
                href={whatsappUrl.toString()}
                rel="noopener noreferrer"
                target="_blank"
              >
                WhatsApp Reference [MANDATORY]
              </a>
              <div className="mt-3 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-[#fbfbfd] p-2 sm:p-6">
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
                  {captionParts.map((part, index) =>
                    part.kind === "text" ? (
                      <span key={`text-${index}`}>{part.value}</span>
                    ) : (
                      <a
                        className="break-all font-semibold text-emerald-700 underline underline-offset-2"
                        href={part.url}
                        key={`link-${index}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {part.label}
                      </a>
                    ),
                  )}
                </p>
              </div>
            </section>
            <p className="mt-8 text-sm text-slate-500">Posted {formatDate(post.created_at)}</p>
          </div>
        </article>
      </div>
    </main>
  );
}
