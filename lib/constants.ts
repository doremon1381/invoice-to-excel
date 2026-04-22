export const DEFAULT_CURRENCY = "VND";

export const IMAGE_MAX_WIDTH = 1600;
export const IMAGE_COMPRESS_QUALITY = 0.85;

export const EXPORT_HISTORY_STORAGE_KEY = "invoice_export_history_v1";
export const OPENAI_API_KEY_STORAGE_KEY = "openai_api_key_secure_v1";

export const OPENAI_BASE_URL =
  "https://platform.beeknoee.com/api/v1/chat/completions";
export const OPENAI_API_KEY = "sk-bee-3848b623181344a88a8a0a718a56230a";
export const OPENAI_MODEL = "gemini-3-flash";
export const OPENAI_EFFORT_LEVEL_MAX = "max";
export const OPENAI_EFFORT_LEVEL_HIGH = "high";
export const OPENAI_EFFORT_LEVEL_MEDIUM = "medium";
export const OPENAI_EFFORT_LEVEL_LOW = "low";
export const MAX_OPENAI_TOKENS = 16384;
export const MAX_OPENAI_TOKENS_PER_IMAGE = 16384;

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
