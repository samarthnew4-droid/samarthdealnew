"use client";

interface HeaderProps {
  onHowItWorks: () => void;
  onRefundTime: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export default function Header({
  onHowItWorks,
  onRefundTime,
  searchValue,
  onSearchChange,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-200/80 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="bg-gradient-to-r from-slate-800 via-blue-800 to-emerald-700 bg-clip-text text-2xl font-black tracking-tight text-transparent drop-shadow-[0_2px_8px_rgba(30,64,175,0.14)] sm:text-3xl">
            SAMARTH DEALS
          </h1>
          <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-3 text-sm font-semibold sm:gap-4">
            <button
              className="text-slate-700 transition hover:text-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-500/20"
              onClick={onHowItWorks}
              type="button"
            >
              How it works
            </button>
            <button
              className="text-slate-700 transition hover:text-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-500/20"
              onClick={onRefundTime}
              type="button"
            >
              Refund Time
            </button>
            <a className="text-slate-700 transition hover:text-orange-700" href="/admin">
              Admin
            </a>
          </nav>
        </div>
        <label className="relative mt-4 block w-full">
          <span className="sr-only">Search deals</span>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="6" />
            <path strokeLinecap="round" d="m20 20-4.35-4.35" />
          </svg>
          <input
            className="h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition duration-300 placeholder:text-slate-500 hover:border-blue-400 focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(59,130,246,0.14)] sm:h-14 sm:text-base"
            type="search"
            value={searchValue}
            onInput={(event) => onSearchChange(event.currentTarget.value)}
            placeholder="Search deals, prices or products..."
          />
        </label>
        <p className="mt-2 text-xs font-medium leading-5 text-amber-800 sm:text-sm">
          ⚠️ Always open the order link first to check slot availability. This applies only to Jayshakthi Deal.
        </p>
      </div>
    </header>
  );
}
