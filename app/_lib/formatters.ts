export function formatPrice(price: number | string | null) {
  if (price === null || price === "") {
    return "Not provided";
  }
  const amount = Number(price);

  if (!Number.isFinite(amount)) {
    return "Not provided";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | null) {
  const parsedDate = date ? new Date(date) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}