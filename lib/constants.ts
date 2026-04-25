import Constants from "expo-constants";

export const DEFAULT_CURRENCY = "VND";

export const IMAGE_MAX_WIDTH = 1600;
export const IMAGE_COMPRESS_QUALITY = 0.85;

export const EXPORT_HISTORY_STORAGE_KEY = "invoice_export_history_v1";
export const OPENAI_API_KEY_STORAGE_KEY = "openai_api_key_secure_v1";
export const GOOGLE_SELECTED_SPREADSHEET_STORAGE_KEY =
  "google_selected_spreadsheet_secure_v1";
export const GOOGLE_TARGET_SHEET_TAB = "Trang tính1";
export const GOOGLE_SHEET_SUMMARY_HEADERS = [
  "Ngày tháng",
  "Tên hóa đơn",
  "Giá tiền hóa đơn",
  "Người thanh toán",
] as const;
export const GOOGLE_SHEETS_API_BASE =
  "https://sheets.googleapis.com/v4/spreadsheets";
export const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
export const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
] as const;

export const OPENAI_BASE_URL =
  "https://platform.beeknoee.com/api/v1/chat/completions";
export const OPENAI_API_KEY = "sk-bee-6a155dc17d864cab98d79e531c617f18";
export const OPENAI_MODEL = "gemini-3-flash";
export const OPENAI_EFFORT_LEVEL_MAX = "max";
export const OPENAI_EFFORT_LEVEL_HIGH = "high";
export const OPENAI_EFFORT_LEVEL_MEDIUM = "medium";
export const OPENAI_EFFORT_LEVEL_LOW = "low";
export const MAX_OPENAI_TOKENS = 16384;
export const MAX_OPENAI_TOKENS_PER_IMAGE = 16384;

type ExpoExtraConfig = {
  googleIosClientId?: string;
  googleWebClientId?: string;
};

const expoExtra = (Constants.expoConfig?.extra ?? {}) as ExpoExtraConfig;

export const GOOGLE_IOS_CLIENT_ID = expoExtra.googleIosClientId ?? "";
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  expoExtra.googleWebClientId ??
  "";

export const EXTRACTION_PROMPT = `You are a financial data extraction specialist. Analyze this invoice image and extract all financial information.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "invoice_title": string | null,
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
  "payer": string | null,
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
- currency should be the 3-letter ISO code (e.g. VND, USD, EUR)
- invoice_title should be a short natural one-line summary of the invoice, easy to read, with no markdown
- invoice_title should usually be around 3 to 8 words
- invoice_title should keep spaces between words
- if a platform is clearly present, use its full name (for example: Shopee, TikTok Shop, Lazada, Tiki)
- prioritize product name first, then company/store name if helpful
- if there are many products, using the company/store name instead of a long list is acceptable
- Examples of good invoice_title values:
  - Shopee tai nghe Anker ABC
  - tai nghe Anker ABC
  - Shopee Cong ty Minh Phat
  - banh gao, sua chua Orion
  - Shopee tai nghe
  - Cong ty Minh Phat`;
