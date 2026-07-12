/** Shared, locale-aware formatting helpers for the admin surface. */

export function money(n: number | null | undefined, currency = 'EUR'): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(n));
  } catch {
    return `${Number(n).toFixed(0)} ${currency}`;
  }
}

/** Compact currency for tight KPI tiles: €12.4k, €1.2M. */
export function compactMoney(n: number | null | undefined, currency = 'EUR'): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(Number(n));
  } catch {
    return `${Number(n).toFixed(0)} ${currency}`;
  }
}

export function num(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return new Intl.NumberFormat().format(Number(n));
}
