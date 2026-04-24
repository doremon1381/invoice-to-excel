import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

import { DEFAULT_CURRENCY } from "@/lib/constants";
import { translate } from "@/lib/i18n";
import { normalizePaymentMethod } from "@/lib/invoice";
import type {
  ExtractedInvoice,
  InvoiceDetail,
  InvoiceListItem,
  InvoiceRow,
  InvoiceStatus,
  LineItem,
  SaveInvoiceInput,
  SheetSyncStatus,
} from "@/lib/types";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initializedPromise: Promise<void> | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === "web") {
    return null;
  }

  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync("invoices.db").catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

function toNullableString(value: SQLite.SQLiteBindValue): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNumber(value: SQLite.SQLiteBindValue): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeSheetSyncStatus(value: SQLite.SQLiteBindValue): SheetSyncStatus {
  return value === "synced" || value === "failed" ? value : "not_synced";
}

function mapInvoiceBase(row: Record<string, SQLite.SQLiteBindValue>): InvoiceRow {
  return {
    id: Number(row.id),
    invoiceTitle: toNullableString(row.invoice_name),
    image_uri: String(row.image_uri),
    image_base64: toNullableString(row.image_base64),
    image_mime: toNullableString(row.image_mime),
    raw_text: toNullableString(row.raw_text),
    scanned_at: String(row.scanned_at),
    status: String(row.status) as InvoiceStatus,
    sheet_sync_status: normalizeSheetSyncStatus(row.sheet_sync_status),
    sheet_synced_at: toNullableString(row.sheet_synced_at),
    sheet_last_error: toNullableString(row.sheet_last_error),
  };
}

function mapInvoiceListItem(
  row: Record<string, SQLite.SQLiteBindValue>,
): InvoiceListItem {
  return {
    ...mapInvoiceBase(row),
    vendor_name: toNullableString(row.vendor_name),
    invoice_number: toNullableString(row.invoice_number),
    invoice_date: toNullableString(row.invoice_date),
    total_amount: toNullableNumber(row.total_amount),
    currency: toNullableString(row.currency) ?? DEFAULT_CURRENCY,
  };
}

function mapLineItem(row: Record<string, SQLite.SQLiteBindValue>): LineItem {
  return {
    id: Number(row.id),
    invoice_id: Number(row.invoice_id),
    description: toNullableString(row.description) ?? "",
    quantity: toNullableNumber(row.quantity),
    unit: toNullableString(row.unit),
    unit_price: toNullableNumber(row.unit_price),
    total_price: toNullableNumber(row.total_price),
  };
}

async function ensureColumn(
  database: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string,
  columnSql: string,
): Promise<void> {
  const tableInfo = await database.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    `PRAGMA table_info(${tableName});`,
  );
  const columns = new Set(tableInfo.map((column) => String(column.name)));

  if (!columns.has(columnName)) {
    await database.execAsync(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnSql};`,
    );
  }
}

async function runSchemaMigrations(
  database: SQLite.SQLiteDatabase,
): Promise<void> {
  await database.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_name TEXT,
      image_uri TEXT NOT NULL,
      image_base64 TEXT,
      image_mime TEXT,
      raw_text TEXT,
      scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      sheet_sync_status TEXT DEFAULT 'not_synced',
      sheet_synced_at DATETIME,
      sheet_last_error TEXT
    );

    CREATE TABLE IF NOT EXISTS invoice_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      vendor_name TEXT,
      vendor_address TEXT,
      invoice_number TEXT,
      invoice_date TEXT,
      due_date TEXT,
      subtotal REAL,
      tax_amount REAL,
      discount_amount REAL,
      total_amount REAL,
      currency TEXT DEFAULT 'VND',
      payer TEXT,
      payment_method TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      description TEXT,
      quantity REAL,
      unit_price REAL,
      unit TEXT,
      total_price REAL
    );
  `);

  const versionRow = await database.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version;",
  );
  const userVersion = versionRow?.user_version ?? 0;

  if (userVersion < 1) {
    await ensureColumn(database, "invoices", "image_base64", "TEXT");
    await ensureColumn(database, "invoices", "image_mime", "TEXT");
    await database.execAsync("PRAGMA user_version = 1;");
  }

  if (userVersion < 2) {
    await ensureColumn(database, "invoice_data", "payer", "TEXT");
    await database.execAsync("PRAGMA user_version = 2;");
  }

  if (userVersion < 3) {
    await ensureColumn(database, "invoices", "invoice_name", "TEXT");
    await database.execAsync("PRAGMA user_version = 3;");
  }

  if (userVersion < 4) {
    await ensureColumn(
      database,
      "invoices",
      "sheet_sync_status",
      "TEXT DEFAULT 'not_synced'",
    );
    await ensureColumn(database, "invoices", "sheet_synced_at", "DATETIME");
    await ensureColumn(database, "invoices", "sheet_last_error", "TEXT");
    await database.execAsync(`
      UPDATE invoices
      SET sheet_sync_status = COALESCE(sheet_sync_status, 'not_synced')
      WHERE sheet_sync_status IS NULL;
      PRAGMA user_version = 4;
    `);
  }
}

async function getReadyDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  const database = await getDatabase();

  if (!database) {
    return null;
  }

  if (!initializedPromise) {
    initializedPromise = runSchemaMigrations(database).catch((error) => {
      initializedPromise = null;
      throw error;
    });
  }

  await initializedPromise;
  return database;
}

async function upsertInvoiceData(
  database: SQLite.SQLiteDatabase,
  invoiceId: number,
  extracted: ExtractedInvoice,
): Promise<void> {
  const updateResult = await database.runAsync(
    `UPDATE invoice_data SET
      vendor_name = ?,
      vendor_address = ?,
      invoice_number = ?,
      invoice_date = ?,
      due_date = ?,
      subtotal = ?,
      tax_amount = ?,
      discount_amount = ?,
      total_amount = ?,
      currency = ?,
      payer = ?,
      payment_method = ?,
      notes = ?
    WHERE invoice_id = ?`,
    [
      extracted.vendor_name,
      extracted.vendor_address,
      extracted.invoice_number,
      extracted.invoice_date,
      extracted.due_date,
      extracted.subtotal,
      extracted.tax_amount,
      extracted.discount_amount,
      extracted.total_amount,
      extracted.currency,
      extracted.payer,
      normalizePaymentMethod(extracted.payment_method),
      extracted.notes,
      invoiceId,
    ],
  );

  if ((updateResult.changes ?? 0) > 0) {
    return;
  }

  await database.runAsync(
    `INSERT INTO invoice_data (
      invoice_id,
      vendor_name,
      vendor_address,
      invoice_number,
      invoice_date,
      due_date,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      currency,
      payer,
      payment_method,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      invoiceId,
      extracted.vendor_name,
      extracted.vendor_address,
      extracted.invoice_number,
      extracted.invoice_date,
      extracted.due_date,
      extracted.subtotal,
      extracted.tax_amount,
      extracted.discount_amount,
      extracted.total_amount,
      extracted.currency,
      extracted.payer,
      normalizePaymentMethod(extracted.payment_method),
      extracted.notes,
    ],
  );
}

async function replaceLineItems(
  database: SQLite.SQLiteDatabase,
  invoiceId: number,
  lineItems: LineItem[],
): Promise<void> {
  await database.runAsync("DELETE FROM line_items WHERE invoice_id = ?", [
    invoiceId,
  ]);

  for (const item of lineItems) {
    await database.runAsync(
      "INSERT INTO line_items (invoice_id, description, quantity, unit_price, unit, total_price) VALUES (?, ?, ?, ?, ?, ?)",
      [
        invoiceId,
        item.description.trim(),
        item.quantity,
        item.unit_price,
        item.unit,
        item.total_price,
      ],
    );
  }
}

export async function initializeDatabase(): Promise<void> {
  await getReadyDatabase();
}

export async function saveInvoice(input: SaveInvoiceInput): Promise<number> {
  const database = await getReadyDatabase();

  if (!database) {
    throw new Error(translate("common.sqliteUnavailable"));
  }

  const createdInvoice = await database.runAsync(
    `INSERT INTO invoices (
      invoice_name,
      image_uri,
      image_base64,
      image_mime,
      raw_text,
      scanned_at,
      status,
      sheet_sync_status,
      sheet_synced_at,
      sheet_last_error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.invoiceTitle,
      input.imageUri,
      input.imageBase64 ?? null,
      input.imageMime ?? null,
      input.rawText,
      input.scannedAt,
      input.status,
      "not_synced",
      null,
      null,
    ],
  );

  const invoiceId = Number(createdInvoice?.lastInsertRowId);
  await upsertInvoiceData(database, invoiceId, input.extracted);
  await replaceLineItems(database, invoiceId, input.extracted.line_items);

  return invoiceId;
}

export async function updateInvoice(
  invoiceId: number,
  patch: {
    invoiceTitle?: string | null;
    extracted: ExtractedInvoice;
    rawText?: string | null;
    status?: InvoiceStatus;
  },
): Promise<void> {
  const database = await getReadyDatabase();

  if (!database) {
    return;
  }

  if (patch.rawText !== undefined) {
    await database.runAsync("UPDATE invoices SET raw_text = ? WHERE id = ?", [
      patch.rawText,
      invoiceId,
    ]);
  }

  if (patch.status !== undefined) {
    await database.runAsync("UPDATE invoices SET status = ? WHERE id = ?", [
      patch.status,
      invoiceId,
    ]);
  }

  if (patch.invoiceTitle !== undefined) {
    await database.runAsync(
      "UPDATE invoices SET invoice_name = ? WHERE id = ?",
      [patch.invoiceTitle, invoiceId],
    );
  }

  await upsertInvoiceData(database, invoiceId, patch.extracted);
  await replaceLineItems(database, invoiceId, patch.extracted.line_items);
}

export async function updateInvoiceSheetSyncStatus(
  invoiceId: number,
  patch: {
    status: SheetSyncStatus;
    syncedAt?: string | null;
    lastError?: string | null;
  },
): Promise<void> {
  const database = await getReadyDatabase();

  if (!database) {
    return;
  }

  await database.runAsync(
    `UPDATE invoices
    SET sheet_sync_status = ?, sheet_synced_at = ?, sheet_last_error = ?
    WHERE id = ?`,
    [
      patch.status,
      patch.syncedAt ?? null,
      patch.lastError ?? null,
      invoiceId,
    ],
  );
}

export async function getAllInvoicesWithData(): Promise<InvoiceListItem[]> {
  const database = await getReadyDatabase();

  if (!database) {
    return [];
  }

  const rows = await database.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    `
    SELECT
      invoices.id,
      invoices.invoice_name,
      invoices.image_uri,
      invoices.image_base64,
      invoices.image_mime,
      invoices.raw_text,
      invoices.scanned_at,
      invoices.status,
      invoices.sheet_sync_status,
      invoices.sheet_synced_at,
      invoices.sheet_last_error,
      invoice_data.vendor_name,
      invoice_data.invoice_number,
      invoice_data.invoice_date,
      invoice_data.total_amount,
      invoice_data.currency
    FROM invoices
    LEFT JOIN invoice_data ON invoice_data.invoice_id = invoices.id
    ORDER BY invoices.scanned_at DESC
  `,
  );

  return rows?.map(mapInvoiceListItem) ?? [];
}

export async function getInvoiceById(
  invoiceId: number,
): Promise<InvoiceDetail> {
  const database = await getReadyDatabase();

  if (!database) {
    throw new Error(translate("common.sqliteUnavailable"));
  }

  const row = await database.getFirstAsync<Record<string, SQLite.SQLiteBindValue>>(
    `SELECT
      invoices.id,
      invoices.invoice_name,
      invoices.image_uri,
      invoices.image_base64,
      invoices.image_mime,
      invoices.raw_text,
      invoices.scanned_at,
      invoices.status,
      invoices.sheet_sync_status,
      invoices.sheet_synced_at,
      invoices.sheet_last_error,
      invoice_data.vendor_name,
      invoice_data.vendor_address,
      invoice_data.invoice_number,
      invoice_data.invoice_date,
      invoice_data.due_date,
      invoice_data.subtotal,
      invoice_data.tax_amount,
      invoice_data.discount_amount,
      invoice_data.total_amount,
      invoice_data.currency,
      invoice_data.payer,
      invoice_data.payment_method,
      invoice_data.notes
    FROM invoices
    LEFT JOIN invoice_data ON invoice_data.invoice_id = invoices.id
    WHERE invoices.id = ?
    LIMIT 1`,
    [invoiceId],
  );

  if (!row) {
    throw new Error(translate("invoice.notFound"));
  }

  const lineItems = await getLineItems(invoiceId);

  return {
    ...mapInvoiceBase(row),
    vendor_name: toNullableString(row.vendor_name),
    vendor_address: toNullableString(row.vendor_address),
    invoice_number: toNullableString(row.invoice_number),
    invoice_date: toNullableString(row.invoice_date),
    due_date: toNullableString(row.due_date),
    subtotal: toNullableNumber(row.subtotal),
    tax_amount: toNullableNumber(row.tax_amount),
    discount_amount: toNullableNumber(row.discount_amount),
    total_amount: toNullableNumber(row.total_amount),
    currency: toNullableString(row.currency) ?? DEFAULT_CURRENCY,
    payer: toNullableString(row.payer),
    payment_method: normalizePaymentMethod(row.payment_method),
    notes: toNullableString(row.notes),
    line_items: lineItems,
  };
}

export async function getLineItems(invoiceId: number): Promise<LineItem[]> {
  const database = await getReadyDatabase();

  if (!database) {
    return [];
  }

  const rows = await database.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    "SELECT id, invoice_id, description, quantity, unit_price, unit, total_price FROM line_items WHERE invoice_id = ? ORDER BY id ASC",
    [invoiceId],
  );

  return rows?.map(mapLineItem) ?? [];
}

export async function deleteInvoice(invoiceId: number): Promise<void> {
  const database = await getReadyDatabase();

  if (!database) {
    return;
  }

  await database.runAsync("DELETE FROM invoices WHERE id = ?", [invoiceId]);
}

export async function deleteNonFinalInvoices(): Promise<number> {
  const database = await getReadyDatabase();

  if (!database) {
    return 0;
  }

  const result = await database.runAsync(
    "DELETE FROM invoices WHERE status NOT IN (?, ?)",
    ["success", "error"],
  );

  return result.changes ?? 0;
}

export async function getInvoiceCount(): Promise<number> {
  const database = await getReadyDatabase();

  if (!database) {
    return 0;
  }

  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM invoices",
  );
  return result?.count ?? 0;
}

export function createPendingInvoice(): ExtractedInvoice {
  return {
    vendor_name: null,
    vendor_address: null,
    invoice_number: null,
    invoice_date: null,
    due_date: null,
    subtotal: null,
    tax_amount: null,
    discount_amount: null,
    total_amount: null,
    currency: DEFAULT_CURRENCY,
    payer: null,
    payment_method: null,
    notes: null,
    line_items: [],
  };
}
