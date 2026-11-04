import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import BrandWordmark from "../../../../_components/brand-wordmark";
import { getAdminProductPost } from "../../../../_lib/admin-product-posts";
import { getAdminSession } from "../../../../_lib/admin-auth";
import CreateDealForm from "../../../create-deal/create-deal-form";
import LogoutButton from "../../../logout-button";

export const dynamic = "force-dynamic";

export default async function EditProductPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, isAuthorized } = await getAdminSession();

  if (!user) redirect("/admin/login");
  if (!isAuthorized) redirect("/admin/access-denied");

  const { id } = await params;
  const { post, errorMessage } = await getAdminProductPost(id);

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] px-4 py-6 text-slate-950 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm font-medium text-amber-900">
          {errorMessage}
        </div>
      </main>
    );
  }
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-6 text-slate-950 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link aria-label="Samarth Deals dashboard" className="block w-full max-w-[400px]" href="/admin">
              <BrandWordmark className="block h-auto w-full" />
            </Link>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Edit Product Post</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-black text-slate-800">#{post.serial_number ?? "—"}</span>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-bold sm:gap-3">
            <Link className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-white hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/10" href="/admin">Dashboard</Link>
            <Link className="inline-flex rounded-xl px-3 py-2 text-slate-600 transition hover:bg-white hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/10" href={`/products/${post.id}`}>View product</Link>
            <LogoutButton />
          </nav>
        </header>
        <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-8">
          <div className="mt-2"><CreateDealForm post={post} /></div>
        </section>
      </div>
    </main>
  );
}
