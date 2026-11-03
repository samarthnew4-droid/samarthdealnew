import { redirect } from "next/navigation";

import LogoutButton from "../logout-button";
import { getAdminSession } from "../../_lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AccessDeniedPage() {
  const { user, isAuthorized } = await getAdminSession();

  if (!user) {
    redirect("/admin/login");
  }

  if (isAuthorized) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-center text-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">Access restricted</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Admin access denied</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your account is authenticated, but it is not authorized to access the admin dashboard.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <LogoutButton />
          <a className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-700" href="/admin/login">
            Return to login
          </a>
        </div>
      </section>
    </main>
  );
}