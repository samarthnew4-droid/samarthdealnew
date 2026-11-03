import Link from "next/link";

export default function DealNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center text-slate-950">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">Deal unavailable</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">We could not find that deal.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">It may have ended or is no longer publicly available.</p>
        <Link className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700" href="/">
          Back to deals
        </Link>
      </div>
    </main>
  );
}