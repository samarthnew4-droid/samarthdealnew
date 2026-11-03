"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "../_lib/supabase-browser";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoading(true);
    setErrorMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) {
      setErrorMessage("We could not sign you out. Please try again.");
      setIsLoading(false);
      return;
    }

    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800 transition hover:border-slate-950 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
        onClick={handleLogout}
        type="button"
      >
        {isLoading ? "Signing out..." : "Sign out"}
      </button>
      {errorMessage && <p aria-live="polite" className="text-xs font-medium text-rose-700">{errorMessage}</p>}
    </div>
  );
}