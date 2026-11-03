import type { Deal, DealVisual } from "../_lib/deals";
import { formatDate, formatPrice } from "../_lib/formatters";
import Link from "next/link";

const visualStyles: Record<
  DealVisual,
  { background: string; label: string; graphic: string }
> = {
  audio: {
    background: "from-violet-100 via-fuchsia-50 to-white",
    label: "Audio deal",
    graphic: "◖◗",
  },
  mobile: {
    background: "from-sky-100 via-cyan-50 to-white",
    label: "Mobile phone deal",
    graphic: "▯",
  },
  kitchen: {
    background: "from-orange-100 via-amber-50 to-white",
    label: "Coffee machine deal",
    graphic: "◒",
  },
  gaming: {
    background: "from-indigo-100 via-blue-50 to-white",
    label: "Gaming console deal",
    graphic: "⌁",
  },
  home: {
    background: "from-emerald-100 via-teal-50 to-white",
    label: "Home appliance deal",
    graphic: "⌇",
  },
  travel: {
    background: "from-rose-100 via-pink-50 to-white",
    label: "Luggage deal",
    graphic: "▣",
  },
};

export default function DealCard({ deal }: { deal: Deal }) {
  const visual = visualStyles[deal.visual];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5">
      {/* Product image */}
      <div
        aria-label={visual.label}
        className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br sm:aspect-[16/10] ${visual.background}`}
        role="img"
      >
        <div className="absolute h-28 w-28 rounded-full border border-white/80 bg-white/55 blur-[1px]" />

        <span className="relative font-mono text-6xl font-black tracking-tighter text-slate-900/80">
          {visual.graphic}
        </span>

        <span className="absolute bottom-3 left-3 rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700 backdrop-blur sm:bottom-4 sm:left-4">
          {deal.brand}
        </span>
      </div>

      {/* Card content */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        {/* Product name + status */}
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
              {deal.brand} · {deal.dealType}
            </p>

            <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-5 text-slate-950 sm:mt-2 sm:text-lg sm:leading-6">
              {deal.productName}
            </h3>
          </div>

          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-extrabold tracking-[0.1em] text-emerald-700 ring-1 ring-inset ring-emerald-600/20 sm:px-2.5 sm:py-1 sm:text-[10px]">
            {deal.status}
          </span>
        </div>

        {/* Description */}
        {deal.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600 sm:mt-3 sm:line-clamp-3 sm:text-sm sm:leading-6">
            {deal.description}
          </p>
        )}

        {/* Prices */}
        <dl className="mt-4 grid grid-cols-2 gap-x-2 border-y border-slate-100 py-3 sm:mt-5 sm:gap-x-3 sm:gap-y-4 sm:py-4">
          <div>
            <dt className="text-[10px] text-slate-500 sm:text-xs">
              Order price
            </dt>

            <dd className="mt-1 text-base font-extrabold text-slate-950 sm:text-lg">
              {formatPrice(deal.orderPrice)}
            </dd>
          </div>

          <div>
            <dt className="text-[10px] font-black uppercase tracking-wide text-emerald-700 sm:text-xs">
              Less price
            </dt>

            <dd className="mt-1 text-xl font-extrabold text-emerald-700 sm:text-2xl">
              {formatPrice(deal.finalPrice)}
            </dd>
          </div>
        </dl>

        {/* Platform + date */}
        <div className="mt-3 flex items-center justify-between gap-2 text-sm sm:mt-4 sm:gap-3">
          <p className="min-w-0 truncate font-medium text-slate-700">
            {deal.platform}
          </p>

          <time
            className="shrink-0 whitespace-nowrap text-[10px] text-slate-500 sm:text-xs"
            dateTime={deal.postedAt ?? undefined}
          >
            Posted {formatDate(deal.postedAt)}
          </time>
        </div>

        {/* View deal */}
        <Link
          href={`/deals/${deal.id}`}
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-950/20 sm:mt-5 sm:h-11"
        >
          View Deal

          <svg
            aria-hidden="true"
            className="ml-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12h14m-6-6 6 6-6 6"
            />
          </svg>
        </Link>
      </div>
    </article>
  );
}