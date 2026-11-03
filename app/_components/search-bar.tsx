"use client";

interface SearchBarProps {
  value: string;
  onQueryChange: (value: string) => void;
}

export default function SearchBar({ value, onQueryChange }: SearchBarProps) {
  return (
    <label className="relative block w-full">
      <span className="sr-only">Search deals</span>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="6" />
        <path strokeLinecap="round" d="m20 20-4.35-4.35" />
      </svg>
      <input
        className="h-12 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] py-3 pl-11 pr-4 text-sm text-slate-950 shadow-[0_0_0_1px_rgba(16,185,129,0.03)] outline-none transition placeholder:text-slate-400 hover:border-emerald-300 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
        type="search"
        value={value}
        onInput={(event) => onQueryChange(event.currentTarget.value)}
        placeholder="Search deals, platforms or prices..."
      />
    </label>
  );
}
