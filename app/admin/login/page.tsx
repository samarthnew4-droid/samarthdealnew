import { redirect } from "next/navigation";

import LoginForm from "./login-form";
import { getAdminSession } from "../../_lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const { user, isAuthorized } = await getAdminSession();

  if (isAuthorized) {
    redirect("/admin");
  }

  if (user) {
    redirect("/admin/access-denied");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">SAMARTH DEALS</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Admin sign in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Sign in to continue to the admin dashboard.</p>
        <LoginForm />
      </section>
    </main>
  );
}