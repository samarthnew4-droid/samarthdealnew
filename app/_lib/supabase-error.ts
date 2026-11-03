export type SupabaseErrorDetails = {
  code: string | null;
  message: string;
  details: string | null;
  hint: string | null;
};

export type SupabaseErrorCategory = "missing-table" | "missing-column" | "rls" | "network" | "unknown";

type SupabaseErrorLike = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  hint?: unknown;
};

export function describeSupabaseError(error: unknown): SupabaseErrorDetails {
  const value = typeof error === "object" && error !== null ? error as SupabaseErrorLike : {};
  return {
    code: typeof value.code === "string" ? value.code : null,
    message: typeof value.message === "string" ? value.message : error instanceof Error ? error.message : String(error),
    details: typeof value.details === "string" ? value.details : null,
    hint: typeof value.hint === "string" ? value.hint : null,
  };
}

export function classifySupabaseError(error: unknown): SupabaseErrorCategory {
  const described = describeSupabaseError(error);
  const message = described.message.toLowerCase();

  if (described.code === "PGRST205" || described.code === "42P01" || (message.includes("relation") && message.includes("does not exist"))) {
    return "missing-table";
  }
  if (described.code === "PGRST204" || described.code === "42703" || message.includes("column") && message.includes("does not exist")) {
    return "missing-column";
  }
  if (described.code === "42501" || message.includes("row-level security") || message.includes("permission denied")) {
    return "rls";
  }
  if (message.includes("fetch failed") || message.includes("enotfound") || message.includes("econn") || message.includes("timeout")) {
    return "network";
  }
  return "unknown";
}

export function logSupabaseError(context: string, error: unknown, level: "error" | "warn" = "error") {
  const safeError = describeSupabaseError(error);
  const payload = { category: classifySupabaseError(error), ...safeError };
  if (level === "warn") console.warn(context, payload);
  else console.error(context, payload);
}
