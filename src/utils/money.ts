export function formatCents(cents: number) {
  const safe = Number.isFinite(cents) ? cents : 0;
  const sign = safe < 0 ? "-" : "";
  const abs = Math.abs(safe);
  return `${sign}$${(abs / 100).toFixed(2)}`;
}

export function dollarsToCents(input: string) {
  const normalized = input.replace(/[^0-9.]/g, "");
  if (!normalized) return 0;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}
