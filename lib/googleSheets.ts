import {
  GOOGLE_SHEET_SUMMARY_HEADERS,
  GOOGLE_SHEETS_API_BASE,
  GOOGLE_TARGET_SHEET_TAB,
} from "@/lib/constants";
import { translate } from "@/lib/i18n";
import { formatLineItemsNote, normalizeInvoiceTitle } from "@/lib/invoice";
import { assertGoogleResponseOk, fetchGoogleApi } from "@/lib/googleApi";
import type { InvoiceDetail } from "@/lib/types";

export type CreatedGoogleSpreadsheet = {
  spreadsheetId: string;
  spreadsheetName: string;
  spreadsheetUrl?: string;
};

type SummaryHeader = (typeof GOOGLE_SHEET_SUMMARY_HEADERS)[number];

type SpreadsheetSheet = {
  properties?: {
    sheetId?: number;
    title?: string;
  };
};

type GridCell = {
  effectiveValue?: {
    boolValue?: boolean;
    formulaValue?: string;
    numberValue?: number;
    stringValue?: string;
  };
};

type GridRow = {
  values?: GridCell[];
};

type SheetGridResponse = {
  data?: Array<{
    rowData?: GridRow[];
  }>;
  properties?: {
    sheetId?: number;
    title?: string;
  };
};

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

function normalizeCellValue(
  value: number | string | null | undefined,
): string | number {
  return value ?? "";
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

function formatSheetDate(value: string | null | undefined): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);

    if (isValidDateParts(year, month, day)) {
      return `${String(day).padStart(2, "0")}/${String(month).padStart(
        2,
        "0",
      )}/${year}`;
    }
  }

  const slashMatch = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s.*)?$/,
  );
  if (!slashMatch) {
    return "";
  }

  const day = Number(slashMatch[1]);
  const month = Number(slashMatch[2]);
  const rawYear = Number(slashMatch[3]);
  const year = slashMatch[3].length === 2 ? 2000 + rawYear : rawYear;

  if (!isValidDateParts(year, month, day)) {
    return "";
  }

  return `${String(day).padStart(2, "0")}/${String(month).padStart(
    2,
    "0",
  )}/${year}`;
}

function toExtendedValue(value: string | number): {
  numberValue?: number;
  stringValue?: string;
} {
  if (typeof value === "number") {
    return { numberValue: value };
  }

  return { stringValue: value };
}

function normalizeHeaderName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getGridCellDisplayValue(cell?: GridCell): string {
  const value = cell?.effectiveValue;

  if (!value) {
    return "";
  }

  if (typeof value.stringValue === "string") {
    return value.stringValue;
  }

  if (typeof value.numberValue === "number") {
    return String(value.numberValue);
  }

  if (typeof value.boolValue === "boolean") {
    return value.boolValue ? "TRUE" : "FALSE";
  }

  if (typeof value.formulaValue === "string") {
    return value.formulaValue;
  }

  return "";
}

function hasEffectiveValue(cell?: GridCell): boolean {
  const value = cell?.effectiveValue;

  return Boolean(
    value &&
      (value.stringValue !== undefined ||
        value.numberValue !== undefined ||
        value.boolValue !== undefined ||
        value.formulaValue !== undefined),
  );
}

function getHeaderRowValues(rowData: GridRow[]): string[] {
  const headerCells = rowData[0]?.values ?? [];
  return headerCells.map(getGridCellDisplayValue);
}

function getLastNonEmptyRowNumber(rowData: GridRow[]): number {
  let lastRowNumber = 0;

  rowData.forEach((row, index) => {
    if (row.values?.some(hasEffectiveValue)) {
      lastRowNumber = index + 1;
    }
  });

  return lastRowNumber;
}

function getTitleCellNote(invoice: InvoiceDetail): string {
  return formatLineItemsNote(invoice.line_items);
}

function mapInvoiceToSummaryRow(invoice: InvoiceDetail): Record<SummaryHeader, string | number> {
  const compactTitle = normalizeInvoiceTitle(invoice.invoiceTitle) ?? "";

  return {
    "Ngày tháng": normalizeCellValue(formatSheetDate(invoice.invoice_date)),
    "Tên hóa đơn": normalizeCellValue(compactTitle),
    "Giá tiền hóa đơn": normalizeCellValue(invoice.total_amount),
    "Người thanh toán": normalizeCellValue(invoice.payer),
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

async function renameSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  title: string,
): Promise<void> {
  const response = await fetchGoogleApi(
    `${GOOGLE_SHEETS_API_BASE}/${encodeURIComponent(
      spreadsheetId,
    )}:batchUpdate`,
    {
      body: JSON.stringify({
        requests: [
          {
            updateSheetProperties: {
              fields: "title",
              properties: {
                sheetId,
                title,
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
}

async function ensureCreatedSpreadsheetUsesTargetTab(
  accessToken: string,
  spreadsheetId: string,
): Promise<void> {
  const sheets = await getSpreadsheetSheets(accessToken, spreadsheetId);

  if (sheets.some((sheet) => sheet.properties?.title === GOOGLE_TARGET_SHEET_TAB)) {
    return;
  }

  const firstSheet = sheets[0];
  const firstSheetId = firstSheet?.properties?.sheetId;

  if (typeof firstSheetId !== "number") {
    throw new Error(
      translate("settings.googleSheetTabMissingMessage", {
        tabName: GOOGLE_TARGET_SHEET_TAB,
      }),
    );
  }

  await renameSheet(
    accessToken,
    spreadsheetId,
    firstSheetId,
    GOOGLE_TARGET_SHEET_TAB,
  );
}

async function getTargetSheetGrid(
  accessToken: string,
  spreadsheetId: string,
): Promise<{ rowData: GridRow[]; sheetId: number }> {
  const sheets = await getSpreadsheetSheets(accessToken, spreadsheetId);
  const targetSheet = sheets.find(
    (sheet) => sheet.properties?.title === GOOGLE_TARGET_SHEET_TAB,
  );

  if (!targetSheet || typeof targetSheet.properties?.sheetId !== "number") {
    throw new Error(
      translate("settings.googleSheetTabMissingMessage", {
        tabName: GOOGLE_TARGET_SHEET_TAB,
      }),
    );
  }

  const range = `${quoteSheetName(GOOGLE_TARGET_SHEET_TAB)}!A1:ZZZ`;
  const response = await fetchGoogleApi(
    `${GOOGLE_SHEETS_API_BASE}/${encodeURIComponent(
      spreadsheetId,
    )}?includeGridData=true&ranges=${encodeRange(
      range,
    )}&fields=${encodeURIComponent(
      "sheets.properties(sheetId,title),sheets.data.rowData.values.effectiveValue",
    )}`,
    {
      headers: getBearerHeaders(accessToken),
    },
  );

  await assertGoogleResponseOk(response);

  const payload = (await response.json()) as {
    sheets?: SheetGridResponse[];
  };

  const targetSheetData = payload.sheets?.find(
    (sheet) => sheet.properties?.sheetId === targetSheet.properties?.sheetId,
  );

  return {
    rowData: targetSheetData?.data?.[0]?.rowData ?? [],
    sheetId: targetSheet.properties.sheetId,
  };
}

function getHeaderColumnIndexes(headerValues: string[]): Partial<Record<SummaryHeader, number>> {
  const columnIndexes: Partial<Record<SummaryHeader, number>> = {};
  const normalizedHeaders = new Map(
    GOOGLE_SHEET_SUMMARY_HEADERS.map((header) => [
      normalizeHeaderName(header),
      header,
    ]),
  );

  headerValues.forEach((headerValue, index) => {
    const matchingHeader = normalizedHeaders.get(normalizeHeaderName(headerValue));

    if (matchingHeader && columnIndexes[matchingHeader] === undefined) {
      columnIndexes[matchingHeader] = index;
    }
  });

  return columnIndexes;
}

function buildHeaderRequests(
  sheetId: number,
  existingHeaderValues: string[],
  columnIndexes: Partial<Record<SummaryHeader, number>>,
): {
  columnIndexes: Record<SummaryHeader, number>;
  requests: object[];
} {
  const nextColumnIndexes = { ...columnIndexes } as Partial<Record<SummaryHeader, number>>;
  let nextAvailableColumnIndex = existingHeaderValues.length;
  const requests: object[] = [];

  for (const header of GOOGLE_SHEET_SUMMARY_HEADERS) {
    if (typeof nextColumnIndexes[header] === "number") {
      continue;
    }

    nextColumnIndexes[header] = nextAvailableColumnIndex;
    requests.push({
      updateCells: {
        fields: "userEnteredValue",
        range: {
          endColumnIndex: nextAvailableColumnIndex + 1,
          endRowIndex: 1,
          sheetId,
          startColumnIndex: nextAvailableColumnIndex,
          startRowIndex: 0,
        },
        rows: [
          {
            values: [
              {
                userEnteredValue: {
                  stringValue: header,
                },
              },
            ],
          },
        ],
      },
    });
    nextAvailableColumnIndex += 1;
  }

  return {
    columnIndexes: nextColumnIndexes as Record<SummaryHeader, number>,
    requests,
  };
}

function buildSummaryRowRequests(
  sheetId: number,
  rowNumber: number,
  columnIndexes: Record<SummaryHeader, number>,
  invoice: InvoiceDetail,
): object[] {
  const summaryRow = mapInvoiceToSummaryRow(invoice);
  const titleCellNote = getTitleCellNote(invoice);
  const startRowIndex = rowNumber - 1;

  return GOOGLE_SHEET_SUMMARY_HEADERS.map((header) => ({
    updateCells: {
      fields:
        header === "Tên hóa đơn" ? "userEnteredValue,note" : "userEnteredValue",
      range: {
        endColumnIndex: columnIndexes[header] + 1,
        endRowIndex: startRowIndex + 1,
        sheetId,
        startColumnIndex: columnIndexes[header],
        startRowIndex,
      },
      rows: [
        {
          values: [
            {
              ...(header === "Tên hóa đơn" ? { note: titleCellNote } : {}),
              userEnteredValue: toExtendedValue(summaryRow[header]),
            },
          ],
        },
      ],
    },
  }));
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
            title: GOOGLE_TARGET_SHEET_TAB,
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

  await ensureCreatedSpreadsheetUsesTargetTab(accessToken, payload.spreadsheetId);

  return {
    spreadsheetId: payload.spreadsheetId,
    spreadsheetName: payload.properties?.title ?? resolvedTitle,
    spreadsheetUrl: payload.spreadsheetUrl,
  };
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

export async function syncInvoiceSummaryToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  invoice: InvoiceDetail,
): Promise<void> {
  const { rowData, sheetId } = await getTargetSheetGrid(accessToken, spreadsheetId);
  const existingHeaderValues = getHeaderRowValues(rowData);
  const currentHeaderIndexes = getHeaderColumnIndexes(existingHeaderValues);
  const { columnIndexes, requests: headerRequests } = buildHeaderRequests(
    sheetId,
    existingHeaderValues,
    currentHeaderIndexes,
  );
  const lastNonEmptyRowNumber = getLastNonEmptyRowNumber(rowData);
  const nextRowNumber = Math.max(lastNonEmptyRowNumber + 1, 2);
  const summaryRowRequests = buildSummaryRowRequests(
    sheetId,
    nextRowNumber,
    columnIndexes,
    invoice,
  );

  const response = await fetchGoogleApi(
    `${GOOGLE_SHEETS_API_BASE}/${encodeURIComponent(
      spreadsheetId,
    )}:batchUpdate`,
    {
      body: JSON.stringify({
        requests: [...headerRequests, ...summaryRowRequests],
      }),
      headers: getJsonBearerHeaders(accessToken),
      method: "POST",
    },
  );

  await assertGoogleResponseOk(response);
}
