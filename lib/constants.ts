export const ANTHROPIC_BASE_URL = "http://localhost:20128";
export const ANTHROPIC_API_KEY = "sk-4c6db985c73f9042-bpx046-8a7caa4d";
export const ANTHROPIC_MODEL = "gpt-5.2-codex";
export const ANTHROPIC_EFFORT_LEVEL = "high";
export const ANTHROPIC_AUTO_UPDATES_CHANNEL = "latest";
export const ANTHROPIC_API_KEY_STORAGE_KEY = "anthropic_api_key";
//export const ANTHROPIC_VERSION = '2023-06-01';
export const DEFAULT_CURRENCY = "VND";
export const IMAGE_MAX_WIDTH = 1200;
export const IMAGE_COMPRESS_QUALITY = 0.8;
export const EXPORT_HISTORY_STORAGE_KEY = "export_history";
export const MAX_ANTHROPIC_TOKENS = 2048;

export const EXTRACTION_PROMPT = `You are a financial data extraction specialist. Analyze this invoice image and extract all financial information.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "vendor_name": string | null,
  "vendor_address": string | null,
  "invoice_number": string | null,
  "invoice_date": string | null,
  "due_date": string | null,
  "subtotal": number | null,
  "tax_amount": number | null,
  "discount_amount": number | null,
  "total_amount": number | null,
  "currency": string,
  "payment_method": string | null,
  "notes": string | null,
  "line_items": [
    {
      "description": string,
      "quantity": number | null,
      "unit": string | null,
      "unit_price": number | null,
      "total_price": number | null
    }
  ]
}

Rules:
- All monetary values must be plain numbers (no currency symbols, no commas)
- If a field is not found, use null
- The invoice may be in Vietnamese — keep Vietnamese as much as possible
- currency should be the 3-letter ISO code (e.g. VND, USD, EUR)`;
