import { GOOGLE_SHEETS_API_BASE } from "@/lib/constants";
import {
  getValidAccessToken,
  GoogleAuthRequiredError,
} from "@/lib/googleAuth";
import type { InvoiceDetail } from "@/lib/types";

export type SheetRowPayload = {
  amount: number | null;
  date: string | null;
  name: string | null;
  payer: string | null;
};

function quoteSheetName(tabName: string): string {
  return `'${tabName.replaceAll("'", "''")}'`;
}

function normalizeConfig(config: {
  spreadsheetId: string;
  tab: string;
}): { spreadsheetId: string; tab: string } {
  const spreadsheetId = config.spreadsheetId.trim();
  const tab = config.tab.trim();

  if (!spreadsheetId) {
    throw new Error("Google Spreadsheet ID is missing.");
  }

  if (!tab) {
    throw new Error("Google Sheet tab name is missing.");
  }

  return { spreadsheetId, tab };
}

async function parseGoogleApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: { message?: string };
    };

    if (payload.error?.message) {
      return payload.error.message;
    }
  } catch {
    // Best-effort parsing.
  }

  return `Google Sheets request failed with status ${response.status}.`;
}

async function getAuthorizationHeader(forceRefresh = false): Promise<string> {
  const accessToken = await getValidAccessToken(forceRefresh);

  if (!accessToken) {
    throw new GoogleAuthRequiredError();
  }

  return `Bearer ${accessToken}`;
}

async function performAuthorizedRequest(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const execute = async (forceRefresh: boolean): Promise<Response> => {
    const authorization = await getAuthorizationHeader(forceRefresh);
    return fetch(input, {
      ...init,
      headers: {
        Authorization: authorization,
        ...init.headers,
      },
    });
  };

  let response = await execute(false);
  if (response.status === 401 || response.status === 403) {
    response = await execute(true);
  }

  if (response.status === 401 || response.status === 403) {
    throw new GoogleAuthRequiredError("Google session expired. Please sign in again.");
  }

  return response;
}

export async function verifySpreadsheetAccess(config: {
  spreadsheetId: string;
  tab: string;
}): Promise<{ tabExists: boolean; title: string }> {
  const normalized = normalizeConfig(config);
  const fields = encodeURIComponent("properties.title,sheets.properties.title");
  const url = `${GOOGLE_SHEETS_API_BASE}/${encodeURIComponent(
    normalized.spreadsheetId,
  )}?fields=${fields}`;

  const response = await performAuthorizedRequest(url);

  if (!response.ok) {
    throw new Error(await parseGoogleApiError(response));
  }

  const payload = (await response.json()) as {
    properties?: { title?: string };
    sheets?: Array<{ properties?: { title?: string } }>;
  };

  const tabExists = (payload.sheets ?? []).some(
    (sheet) => sheet.properties?.title === normalized.tab,
  );

  return {
    tabExists,
    title: payload.properties?.title ?? normalized.spreadsheetId,
  };
}

export async function appendInvoiceRow(
  config: { spreadsheetId: string; tab: string },
  row: SheetRowPayload,
): Promise<void> {
  const normalized = normalizeConfig(config);
  const range = `${quoteSheetName(normalized.tab)}!A:F`;
  const encodedRange = encodeURIComponent(range);
  const endpoint = `${GOOGLE_SHEETS_API_BASE}/${encodeURIComponent(
    normalized.spreadsheetId,
  )}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const values = [
    row.date ?? "",
    "",
    "",
    row.name ?? "",
    row.amount ?? "",
    row.payer ?? "",
  ];

  const response = await performAuthorizedRequest(endpoint, {
    body: JSON.stringify({ values: [values] }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await parseGoogleApiError(response));
  }
}

export function mapInvoiceToSheetRow(invoice: InvoiceDetail): SheetRowPayload {
  return {
    amount: invoice.total_amount,
    date: invoice.invoice_date,
    name: invoice.vendor_name ?? invoice.invoice_number,
    payer: null,
  };
}
