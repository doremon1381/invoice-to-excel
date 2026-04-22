import { DEFAULT_CURRENCY } from "@/lib/constants";
import type { InvoiceListItem } from "@/lib/types";

const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;

/**
 * Success invoices with a total only. Date: invoice_date if YYYY-MM-DD, else scanned_at.
 * Sum those whose date falls in the current calendar month (local). Currency = mode of included rows.
 */
export function computeMonthlyExpense(invoices: InvoiceListItem[]): {
  totalAmount: number;
  currency: string;
  monthDate: Date;
} {
  const now = new Date();
  const monthDate = new Date(now.getFullYear(), now.getMonth(), 1);

  const currencyCounts = new Map<string, number>();
  let totalAmount = 0;

  for (const invoice of invoices) {
    if (invoice.status !== "success" || invoice.total_amount == null) {
      continue;
    }

    const eventDate = resolveInvoiceEventDate(invoice);
    if (!eventDate || !isSameCalendarMonth(eventDate, now)) {
      continue;
    }

    totalAmount += invoice.total_amount;
    const code = invoice.currency?.trim().toUpperCase() || DEFAULT_CURRENCY;
    currencyCounts.set(code, (currencyCounts.get(code) ?? 0) + 1);
  }

  const currency =
    currencyCounts.size === 0
      ? DEFAULT_CURRENCY
      : [...currencyCounts.entries()].sort((a, b) => b[1] - a[1])[0]![0];

  return { totalAmount, currency, monthDate };
}

function resolveInvoiceEventDate(invoice: InvoiceListItem): Date | null {
  if (invoice.invoice_date && ISO_DATE_PREFIX.test(invoice.invoice_date)) {
    const ymd = invoice.invoice_date.slice(0, 10);
    const parsed = new Date(`${ymd}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const normalized = invoice.scanned_at.includes(" ")
    ? invoice.scanned_at.replace(" ", "T")
    : invoice.scanned_at;
  const fromScan = new Date(normalized);
  if (!Number.isNaN(fromScan.getTime())) {
    return fromScan;
  }

  return null;
}

function isSameCalendarMonth(date: Date, reference: Date): boolean {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}
