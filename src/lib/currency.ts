// Currency symbol mapping and formatting utilities

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
  CNY: "¥",
  SGD: "S$",
  AED: "AED ",
  BRL: "R$",
  MXN: "MX$",
  KRW: "₩",
  THB: "฿",
  TRY: "₺",
  ZAR: "R",
  PHP: "₱",
  MYR: "RM",
  IDR: "Rp",
  VND: "₫",
};

const CURRENCY_LOCALES: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency?.toUpperCase()] || `${currency} `;
}

function getLocale(currency: string): string {
  return CURRENCY_LOCALES[currency?.toUpperCase()] || "en-US";
}

/** Format a monetary value with the correct currency symbol */
export function formatCurrency(amount: number, currency: string): string {
  const sym = getCurrencySymbol(currency);
  const locale = getLocale(currency);
  return `${sym}${amount.toLocaleString(locale)}`;
}

/** Short format: 1.2K, 3.5L (for INR), 1.2M */
export function formatCurrencyShort(amount: number, currency: string): string {
  const sym = getCurrencySymbol(currency);
  if (currency?.toUpperCase() === "INR") {
    if (amount >= 100000) return `${sym}${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${sym}${(amount / 1000).toFixed(1)}K`;
    return `${sym}${amount.toFixed(0)}`;
  }
  if (amount >= 1000000) return `${sym}${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${sym}${(amount / 1000).toFixed(1)}K`;
  return `${sym}${amount.toFixed(0)}`;
}

/** Format with fixed decimals (for CPC etc.) */
export function formatCurrencyFixed(amount: number, currency: string, decimals = 2): string {
  const sym = getCurrencySymbol(currency);
  return `${sym}${amount.toFixed(decimals)}`;
}
