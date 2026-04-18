export const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
export const ANTHROPIC_VERSION = '2023-06-01';
export const DEFAULT_CURRENCY = 'VND';
export const IMAGE_MAX_WIDTH = 1200;
export const IMAGE_COMPRESS_QUALITY = 0.8;
export const API_KEY_STORAGE_KEY = 'anthropic_api_key';
export const OCR_SERVER_URL_STORAGE_KEY = 'ocr_server_url';
export const EXPORT_HISTORY_STORAGE_KEY = 'export_history';
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
- Dates must be in ISO 8601 format (YYYY-MM-DD) if possible
- If a field is not found, use null
- The invoice may be in Vietnamese — translate field values to English where appropriate
- currency should be the 3-letter ISO code (e.g. VND, USD, EUR)`;
