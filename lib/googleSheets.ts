import {
  GOOGLE_INVOICES_SHEET_TAB,
  GOOGLE_SHEETS_API_BASE,
} from "@/lib/constants";
import { translate } from "@/lib/i18n";
import { formatLineItemsNote } from "@/lib/invoice";
import { assertGoogleResponseOk, fetchGoogleApi } from "@/lib/googleApi";
import type { InvoiceDetail } from "@/lib/types";

export type CreatedGoogleSpreadsheet = {
  spreadsheetId: string;
  spreadsheetName: string;
  spreadsheetUrl?: string;
};

type SpreadsheetSheet = {
  properties?: {
    sheetId?: number;
    title?: string;
  };
};

function getInvoiceSummaryHeaderRow(): string[] {
  return [
    translate("invoice.labelDate"),
    translate("invoice.pushSheetInvoiceName"),
    translate("invoice.labelTotal"),
    translate("invoice.labelPayer"),
  ];
}

function quoteSheetName(tabName: string): string {
  return `'${tabName.replaceAll("'", "''")}'`;
}

function encodeRange(range: string): string {
  return encodeURIComponent(range);
}

function getBearerHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function getJsonBearerHeaders(accessToken: string): Record<string, string> {
  return {
    ...getBearerHeaders(accessToken),
    "Content-Type": "application/json",
  };
}

function normalizeCellValue(value: number | string | null | undefined): string | number {
  return value ?? "";
}

function getTitleCellNote(invoice: InvoiceDetail): string {
  return formatLineItemsNote(invoice.line_items);
}

function mapInvoiceToSummaryRow(invoice: InvoiceDetail): Array<string | number> {
  return [
    normalizeCellValue(invoice.invoice_date),
    normalizeCellValue(invoice.invoiceTitle),
    normalizeCellValue(invoice.total_amount),
    normalizeCellValue(invoice.payer),
  ];
}

function toExtendedValue(value: string | number): { numberValue?: number; stringValue?: string } {
  if (typeof value === "number") {
    return { numberValue: value };
  }

  return { stringValue: value };
}

function buildRowData(invoice: InvoiceDetail): {
  values: Array<{
    note?: string;
    userEnteredValue: { numberValue?: number; stringValue?: string };
  }>;
} {
  const summaryRow = mapInvoiceToSummaryRow(invoice);
  const titleCellNote = getTitleCellNote(invoice);

  return {
    values: summaryRow.map((value, index) => ({
      ...(index === 1 && titleCellNote ? { note: titleCellNote } : {}),
      userEnteredValue: toExtendedValue(value),
    })),
  };
}

async function getSpreadsheetSheets(
  accessToken: string,
  spreadsheetId: string,
): Promise<SpreadsheetSheet[]> {
  const response = await fetchGoogleApi(
    `${GOOGLE_SHEETS_API_BASE}/${encodeURIComponent(
      spreadsheetId,
    )}?fields=${encodeURIComponent("sheets.properties(sheetId,title)")}`,
    {
      headers: getBearerHeaders(accessToken),
    },
  );

  await assertGoogleResponseOk(response);

  const payload = (await response.json()) as {
    sheets?: SpreadsheetSheet[];
  };

  return payload.sheets ?? [];
}

async function addInvoicesTab(
  accessToken: string,
  spreadsheetId: string,
): Promise<number> {
  const response = await fetchGoogleApi(
    `${GOOGLE_SHEETS_API_BASE}/${encodeURIComponent(
      spreadsheetId,
    )}:batchUpdate`,
    {
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: GOOGLE_INVOICES_SHEET_TAB,
              },
            },
          },
        ],
      }),
      headers: getJsonBearerHeaders(accessToken),
      method: "POST",
    },
  );

  await assertGoogleResponseOk(response);

  const payload = (await response.json()) as {
    replies?: Array<{
      addSheet?: { properties?: { sheetId?: number } };
    }>;
  };

  const sheetId = payload.replies?.[0]?.addSheet?.properties?.sheetId;

  if (typeof sheetId !== "number") {
    throw new Error(translate("settings.googleApiMissingSheetId"));
  }

  return sheetId;
}

export async function createGoogleSpreadsheet(
  accessToken: string,
  title: string,
): Promise<CreatedGoogleSpreadsheet> {
  const resolvedTitle =
    title.trim() || translate("settings.googleDefaultSpreadsheetTitle");
  const response = await fetchGoogleApi(GOOGLE_SHEETS_API_BASE, {
    body: JSON.stringify({
      properties: {
        title: resolvedTitle,
      },
      sheets: [
        {
          properties: {
            title: GOOGLE_INVOICES_SHEET_TAB,
          },
        },
      ],
    }),
    headers: getJsonBearerHeaders(accessToken),
    method: "POST",
  });

  await assertGoogleResponseOk(response);

  const payload = (await response.json()) as {
    properties?: { title?: string };
    spreadsheetId?: string;
    spreadsheetUrl?: string;
  };

  if (!payload.spreadsheetId) {
    throw new Error(translate("settings.googleApiMissingSpreadsheetId"));
  }

  return {
    spreadsheetId: payload.spreadsheetId,
    spreadsheetName: payload.properties?.title ?? resolvedTitle,
    spreadsheetUrl: payload.spreadsheetUrl,
  };
}

export async function writeInvoiceHeader(
  accessToken: string,
  spreadsheetId: string,
): Promise<void> {
  const range = `${quoteSheetName(GOOGLE_INVOICES_SHEET_TAB)}!A1:D1`;
  const response = await fetchGoogleApi(
    `${GOOGLE_SHEETS_API_BASE}/${encodeURIComponent(
      spreadsheetId,
    )}/values/${encodeRange(range)}?valueInputOption=USER_ENTERED`,
    {
      body: JSON.stringify({ values: [getInvoiceSummaryHeaderRow()] }),
      headers: getJsonBearerHeaders(accessToken),
      method: "PUT",
    },
  );

  await assertGoogleResponseOk(response);
}

export async function getSpreadsheetTabs(
  accessToken: string,
  spreadsheetId: string,
): Promise<string[]> {
  const sheets = await getSpreadsheetSheets(accessToken, spreadsheetId);

  return sheets
    .map((sheet) => sheet.properties?.title)
    .filter((title): title is string => typeof title === "string");
}

export async function ensureInvoicesTab(
  accessToken: string,
  spreadsheetId: string,
): Promise<number> {
  const sheets = await getSpreadsheetSheets(accessToken, spreadsheetId);
  const existingSheet = sheets.find(
    (sheet) => sheet.properties?.title === GOOGLE_INVOICES_SHEET_TAB,
  );

  const sheetId =
    typeof existingSheet?.properties?.sheetId === "number"
      ? existingSheet.properties.sheetId
      : await addInvoicesTab(accessToken, spreadsheetId);

  await writeInvoiceHeader(accessToken, spreadsheetId);

  return sheetId;
}

export async function syncInvoiceSummaryToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  invoice: InvoiceDetail,
): Promise<void> {
  const sheetId = await ensureInvoicesTab(accessToken, spreadsheetId);
  const response = await fetchGoogleApi(
    `${GOOGLE_SHEETS_API_BASE}/${encodeURIComponent(
      spreadsheetId,
    )}:batchUpdate`,
    {
      body: JSON.stringify({
        requests: [
          {
            appendCells: {
              fields: "userEnteredValue,note",
              rows: [buildRowData(invoice)],
              sheetId,
            },
          },
        ],
      }),
      headers: getJsonBearerHeaders(accessToken),
      method: "POST",
    },
  );

  await assertGoogleResponseOk(response);
}
