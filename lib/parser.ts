import { DEFAULT_CURRENCY } from '@/lib/constants';
import type { ExtractedInvoice, InvoiceStatus, LineItem } from '@/lib/types';

function normalizeNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.replace(/,/g, '').trim();

    if (normalizedValue.length === 0) {
      return null;
    }

    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function normalizeLineItem(value: unknown): LineItem {
  const item = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

  return {
    description: normalizeNullableString(item.description) ?? 'Line item',
    quantity: normalizeNullableNumber(item.quantity),
    unit: normalizeNullableString(item.unit),
    unit_price: normalizeNullableNumber(item.unit_price),
    total_price: normalizeNullableNumber(item.total_price),
  };
}

function extractJsonObject(rawText: string): string {
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('The AI response did not contain valid JSON.');
  }

  return rawText.slice(firstBrace, lastBrace + 1);
}

function normalizeDate(value: string): string | null {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const slashMatch = trimmed.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);

  if (!slashMatch) {
    return null;
  }

  const day = slashMatch[1].padStart(2, '0');
  const month = slashMatch[2].padStart(2, '0');
  const year = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
  return `${year}-${month}-${day}`;
}

function findLabeledValue(lines: string[], patterns: RegExp[]): string | null {
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);

      if (match?.[1]) {
        return match[1].trim();
      }
    }
  }

  return null;
}

function findAmount(lines: string[], labels: string[]): number | null {
  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    if (!labels.some((label) => lowerLine.includes(label))) {
      continue;
    }

    const match = line.match(/(-?\d[\d,.]*)/g);
    const candidate = match?.[match.length - 1];

    if (!candidate) {
      continue;
    }

    const parsed = normalizeNullableNumber(candidate);

    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function findCurrency(rawText: string): string {
  const upper = rawText.toUpperCase();

  if (upper.includes('USD') || rawText.includes('$')) {
    return 'USD';
  }

  if (upper.includes('EUR') || rawText.includes('€')) {
    return 'EUR';
  }

  if (upper.includes('VND') || upper.includes('VNĐ') || upper.includes('DONG')) {
    return 'VND';
  }

  return DEFAULT_CURRENCY;
}

function findDates(lines: string[]): { invoiceDate: string | null; dueDate: string | null } {
  const invoiceDateValue = findLabeledValue(lines, [
    /invoice\s*date[:\s-]+(.+)/i,
    /date[:\s-]+(.+)/i,
  ]);
  const dueDateValue = findLabeledValue(lines, [/due\s*date[:\s-]+(.+)/i, /payment\s*due[:\s-]+(.+)/i]);

  return {
    dueDate: dueDateValue ? normalizeDate(dueDateValue) : null,
    invoiceDate: invoiceDateValue ? normalizeDate(invoiceDateValue) : null,
  };
}

function findVendorName(lines: string[]): string | null {
  const candidate = lines.find((line) => {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    return (
      trimmed.length > 2 &&
      !lower.includes('invoice') &&
      !lower.includes('date') &&
      !lower.includes('total') &&
      !/^\d/.test(trimmed)
    );
  });

  return candidate ? normalizeNullableString(candidate) : null;
}

function scoreExtraction(extracted: ExtractedInvoice): InvoiceStatus {
  const score = [
    extracted.vendor_name,
    extracted.invoice_number,
    extracted.invoice_date,
    extracted.total_amount,
  ].filter((value) => value !== null).length;

  return score >= 2 ? 'success' : 'pending';
}

export function parseExtractedJSON(rawText: string): ExtractedInvoice {
  const jsonText = extractJsonObject(rawText);
  const parsedValue = JSON.parse(jsonText) as Record<string, unknown>;
  const lineItems = Array.isArray(parsedValue.line_items) ? parsedValue.line_items.map(normalizeLineItem) : [];

  return {
    vendor_name: normalizeNullableString(parsedValue.vendor_name),
    vendor_address: normalizeNullableString(parsedValue.vendor_address),
    invoice_number: normalizeNullableString(parsedValue.invoice_number),
    invoice_date: normalizeNullableString(parsedValue.invoice_date),
    due_date: normalizeNullableString(parsedValue.due_date),
    subtotal: normalizeNullableNumber(parsedValue.subtotal),
    tax_amount: normalizeNullableNumber(parsedValue.tax_amount),
    discount_amount: normalizeNullableNumber(parsedValue.discount_amount),
    total_amount: normalizeNullableNumber(parsedValue.total_amount),
    currency: normalizeNullableString(parsedValue.currency) ?? DEFAULT_CURRENCY,
    payment_method: normalizeNullableString(parsedValue.payment_method),
    notes: normalizeNullableString(parsedValue.notes),
    line_items: lineItems,
  };
}

export function parseOcrText(rawText: string): { extracted: ExtractedInvoice; status: InvoiceStatus } {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const { dueDate, invoiceDate } = findDates(lines);
  const extracted: ExtractedInvoice = {
    vendor_name: findVendorName(lines),
    vendor_address: null,
    invoice_number: findLabeledValue(lines, [
      /invoice\s*(?:no|number|#)?[:\s-]+(.+)/i,
      /bill\s*(?:no|number|#)?[:\s-]+(.+)/i,
      /no[:\s-]+(.+)/i,
    ]),
    invoice_date: invoiceDate,
    due_date: dueDate,
    subtotal: findAmount(lines, ['subtotal', 'sub total']),
    tax_amount: findAmount(lines, ['tax', 'vat']),
    discount_amount: findAmount(lines, ['discount']),
    total_amount: findAmount(lines, ['total', 'amount due', 'grand total']),
    currency: findCurrency(rawText),
    payment_method: findLabeledValue(lines, [/payment\s*method[:\s-]+(.+)/i]),
    notes: rawText.trim(),
    line_items: [],
  };

  return {
    extracted,
    status: scoreExtraction(extracted),
  };
}

export { normalizeNullableNumber, normalizeNullableString };
