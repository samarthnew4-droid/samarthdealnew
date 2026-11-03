export function numericPrice(value: number | string | null | undefined) {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    return null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

export function savingsPercentage(orderPrice: number | string | null | undefined, lessPrice: number | string | null | undefined) {
  const order = numericPrice(orderPrice);
  const less = numericPrice(lessPrice);

  if (order === null || less === null || order <= 0 || less < 0 || less > order) return null;
  return (less / order) * 100;
}
