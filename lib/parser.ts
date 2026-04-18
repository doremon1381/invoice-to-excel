import { DEFAULT_CURRENCY } from '@/lib/constants';
import type { ExtractedInvoice, LineItem } from '@/lib/types';

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
  const item = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};

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

export function parseExtractedJSON(rawText: string): ExtractedInvoice {
  const jsonText = extractJsonObject(rawText);
  const parsedValue = JSON.parse(jsonText) as Record<string, unknown>;
  const lineItems = Array.isArray(parsedValue.line_items)
    ? parsedValue.line_items.map(normalizeLineItem)
    : [];

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
