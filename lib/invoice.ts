import type { LineItem, PaymentMethod } from "@/lib/types";

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePaymentMethod(value: unknown): PaymentMethod {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = normalizeSearchText(value);

  if (!normalized) {
    return null;
  }

  if (
    normalized === "bank transfer" ||
    normalized === "transfer" ||
    normalized === "wire transfer" ||
    normalized === "chuyen khoan"
  ) {
    return "bank_transfer";
  }

  if (normalized === "cash" || normalized === "tien mat") {
    return "cash";
  }

  return null;
}

function formatLineItemValue(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function formatLineItemNote(lineItem: LineItem): string | null {
  const qty = formatLineItemValue(lineItem.quantity);
  const unit = formatLineItemValue(lineItem.unit);
  const description = formatLineItemValue(lineItem.description);
  const totalPrice = formatLineItemValue(lineItem.total_price);

  const lead = [qty, unit, description].filter(Boolean).join(" ").trim();

  if (!lead && !totalPrice) {
    return null;
  }

  if (lead && totalPrice) {
    return `- ${lead} | ${totalPrice}`;
  }

  if (lead) {
    return `- ${lead}`;
  }

  return `- ${totalPrice}`;
}

export function formatLineItemsNote(lineItems: LineItem[]): string {
  return lineItems
    .map(formatLineItemNote)
    .filter((value): value is string => Boolean(value))
    .join("\n");
}
