import type { ExtractedInvoice, LineItem, PaymentMethod } from "@/lib/types";

const MAX_INVOICE_TITLE_WORDS = 8;
const MAX_PRODUCT_WORDS = 3;
const MAX_COMPANY_WORDS = 3;

const PLATFORM_LABELS = [
  { label: "Shopee", pattern: /\bshopee\b/i },
  { label: "TikTok Shop", pattern: /\btiktok(?:\s*shop)?\b/i },
  { label: "Lazada", pattern: /\blazada\b/i },
  { label: "Tiki", pattern: /\btiki\b/i },
] as const;

const EXACT_GENERIC_TITLES = new Set([
  "bill",
  "chi tiet",
  "chi tiet don hang",
  "don hang",
  "hoa don",
  "invoice",
  "order",
  "payment",
  "receipt",
]);

const GENERIC_TITLE_WORDS = new Set([
  "bill",
  "chi",
  "chi tiet",
  "don",
  "giao",
  "hang",
  "hoa",
  "invoice",
  "mall",
  "order",
  "payment",
  "pham",
  "receipt",
  "san",
  "shop",
  "store",
  "tiet",
]);

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitleSpacing(value: string): string {
  return value
    .replace(/[_|]+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function trimTitleEdges(value: string): string {
  return value
    .replace(/^[,.;:/\\|+\-–—()\[\]{}]+/u, "")
    .replace(/[,.;:/\\|+\-–—()\[\]{}]+$/u, "")
    .trim();
}

function limitWords(value: string, maxWords: number): string {
  const tokens = value.split(/\s+/).filter(Boolean);
  return trimTitleEdges(tokens.slice(0, maxWords).join(" "));
}

function normalizeTitleSegment(
  value: string | null | undefined,
  maxWords = MAX_INVOICE_TITLE_WORDS,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = trimTitleEdges(normalizeTitleSpacing(value));
  if (!normalized) {
    return null;
  }

  const limited = limitWords(normalized, maxWords);
  return limited || null;
}

function tokenizeWords(value: string): string[] {
  return value.match(/[\p{L}\p{N}]+/gu) ?? [];
}

function detectPlatformLabel(
  values: Array<string | null | undefined>,
): string | null {
  for (const value of values) {
    if (!value) {
      continue;
    }

    for (const platform of PLATFORM_LABELS) {
      if (platform.pattern.test(value)) {
        return platform.label;
      }
    }
  }

  return null;
}

function stripLeadingPlatform(value: string, platformLabel: string | null): string {
  if (!platformLabel) {
    return value;
  }

  const pattern = new RegExp(`^${platformLabel.replace(/\s+/g, "\\s+")}\\b\\s*`, "i");
  return value.replace(pattern, "").trim();
}

function isGenericWordOnlyTitle(value: string): boolean {
  const words = tokenizeWords(normalizeSearchText(value));
  return (
    words.length > 0 &&
    words.length <= 3 &&
    words.every((word) => GENERIC_TITLE_WORDS.has(word))
  );
}

function isGenericInvoiceTitle(
  value: string | null | undefined,
  platformLabel: string | null,
): boolean {
  const normalizedTitle = normalizeTitleSegment(value);

  if (!normalizedTitle) {
    return true;
  }

  const normalizedSearchTitle = normalizeSearchText(normalizedTitle);

  if (!normalizedSearchTitle) {
    return true;
  }

  if (EXACT_GENERIC_TITLES.has(normalizedSearchTitle)) {
    return true;
  }

  if (
    platformLabel &&
    normalizedSearchTitle === normalizeSearchText(platformLabel)
  ) {
    return true;
  }

  return isGenericWordOnlyTitle(normalizedTitle);
}

function areEquivalentSegments(a: string | null, b: string | null): boolean {
  if (!a || !b) {
    return false;
  }

  return normalizeSearchText(a) === normalizeSearchText(b);
}

function uniqueSegments(segments: Array<string | null | undefined>): string[] {
  const result: string[] = [];

  for (const segment of segments) {
    const normalized = normalizeTitleSegment(segment);

    if (!normalized) {
      continue;
    }

    if (result.some((existing) => areEquivalentSegments(existing, normalized))) {
      continue;
    }

    result.push(normalized);
  }

  return result;
}

function getCompanyName(
  extracted: ExtractedInvoice,
  platformLabel: string | null,
): string | null {
  const company = normalizeTitleSegment(
    extracted.vendor_name,
    MAX_COMPANY_WORDS,
  );

  if (!company) {
    return null;
  }

  if (platformLabel && areEquivalentSegments(company, platformLabel)) {
    return null;
  }

  return stripLeadingPlatform(company, platformLabel) || null;
}

function getMeaningfulProductName(
  value: string | null | undefined,
  platformLabel: string | null,
): string | null {
  const normalized = normalizeTitleSegment(value, MAX_PRODUCT_WORDS);

  if (!normalized) {
    return null;
  }

  const withoutPlatform = stripLeadingPlatform(normalized, platformLabel);
  if (!withoutPlatform || isGenericInvoiceTitle(withoutPlatform, null)) {
    return null;
  }

  return withoutPlatform;
}

function getProductNames(
  extracted: ExtractedInvoice,
  platformLabel: string | null,
): string[] {
  return uniqueSegments(
    extracted.line_items.map((item) =>
      getMeaningfulProductName(item.description, platformLabel),
    ),
  );
}

function buildFallbackInvoiceTitle(
  extracted: ExtractedInvoice,
  aiTitle: string | null | undefined,
): string | null {
  const platformLabel = detectPlatformLabel([
    extracted.vendor_name,
    extracted.notes,
    aiTitle,
  ]);
  const companyName = getCompanyName(extracted, platformLabel);
  const productNames = getProductNames(extracted, platformLabel);

  if (productNames.length >= 3) {
    return normalizeTitleSegment(
      [platformLabel, companyName].filter(Boolean).join(" ") || companyName,
    );
  }

  if (productNames.length === 2) {
    const companySuffix =
      companyName &&
      !productNames.some((product) => areEquivalentSegments(product, companyName))
        ? ` ${companyName}`
        : "";

    return normalizeTitleSegment(
      `${productNames[0]}, ${productNames[1]}${companySuffix}`,
    );
  }

  if (productNames.length === 1) {
    const companySegment =
      companyName && !areEquivalentSegments(productNames[0], companyName)
        ? companyName
        : null;

    return normalizeTitleSegment(
      [platformLabel, productNames[0], companySegment]
        .filter(Boolean)
        .join(" "),
    );
  }

  return normalizeTitleSegment(
    [platformLabel, companyName].filter(Boolean).join(" "),
  );
}

export function normalizeInvoiceTitle(
  value: string | null | undefined,
): string | null {
  return normalizeTitleSegment(value);
}

export function buildInvoiceTitleSuggestion(
  extracted: ExtractedInvoice,
  aiTitle: string | null | undefined,
): string | null {
  const platformLabel = detectPlatformLabel([
    extracted.vendor_name,
    extracted.notes,
    aiTitle,
  ]);
  const normalizedAiTitle = normalizeInvoiceTitle(aiTitle);

  if (!isGenericInvoiceTitle(normalizedAiTitle, platformLabel)) {
    return normalizedAiTitle;
  }

  return buildFallbackInvoiceTitle(extracted, aiTitle);
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

export function compactManualInvoiceTitle(
  value: string | null | undefined,
): string | null {
  return normalizeInvoiceTitle(value);
}

export function buildCompactInvoiceTitle(
  extracted: ExtractedInvoice,
  aiTitle: string | null | undefined,
): string | null {
  return buildInvoiceTitleSuggestion(extracted, aiTitle);
}

export function resolveInvoiceTitle(
  extracted: ExtractedInvoice,
  title: string | null | undefined,
): string | null {
  return buildInvoiceTitleSuggestion(extracted, title);
}
