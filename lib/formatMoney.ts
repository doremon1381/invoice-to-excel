import { getIntlLocale } from "@/lib/i18n";

/**
 * Locale-aware amount formatting for dashboard and list displays.
 * Returns numeric string and ISO currency code separately for split styling.
 */
export function formatMoney(
  amount: number,
  currency: string,
  locale: string,
): { value: string; currency: string } {
  const upper = currency.trim().toUpperCase();
  const isZeroFraction = upper === "VND" || upper === "JPY";
  const intlLocale = getIntlLocale(locale);

  const formatter = new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: isZeroFraction ? 0 : 2,
    maximumFractionDigits: isZeroFraction ? 0 : 2,
  });

  return { value: formatter.format(amount), currency: upper };
}

export function formatCurrency(
  value: number | null,
  currency: string,
  locale?: string,
): string {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: currency.trim().toUpperCase(),
  }).format(value);
}
